const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Firebase
let db = null;
try {
  if (!admin.apps.length) {
    try {
      const serviceAccount = require('./firebase-config.json');
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      });
    }
    db = admin.firestore();
    console.log('✅ Firebase conectado');
  }
} catch (error) {
  console.log('⚠️ Firebase não configurado');
}

const HOTMART_BASE_URL = 'https://developers.hotmart.com';

const ENDPOINTS = {
  subscriptions: `${HOTMART_BASE_URL}/payments/api/v1/subscriptions`,
  sales: `${HOTMART_BASE_URL}/payments/api/v1/sales`,
  salesHistory: `${HOTMART_BASE_URL}/payments/api/v1/sales/history`,
  products: `${HOTMART_BASE_URL}/payments/api/v1/products`
};

let tokenStorage = {
  accessToken: null,
  expiresAt: null,
  credentials: null,
  renewalTimer: null
};

function isTokenValid() {
  return tokenStorage.accessToken && tokenStorage.expiresAt && tokenStorage.expiresAt > Date.now();
}

async function getHotmartToken(clientId, clientSecret, basicToken) {
  try {
    const response = await axios.post(
      'https://api-sec-vlc.hotmart.com/security/oauth/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${basicToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    tokenStorage = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in * 1000),
      credentials: { clientId, clientSecret, basicToken }
    };

    console.log('✅ Token Hotmart obtido');

    if (db) {
      await db.collection('hotmart_config').doc('token').set({
        accessToken: response.data.access_token,
        expiresAt: tokenStorage.expiresAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const renewTime = (response.data.expires_in - 300) * 1000;
    if (tokenStorage.renewalTimer) clearTimeout(tokenStorage.renewalTimer);
    
    tokenStorage.renewalTimer = setTimeout(async () => {
      if (tokenStorage.credentials) {
        await autoLogin();
      }
    }, renewTime);

    return response.data;
  } catch (error) {
    throw new Error(`Erro de autenticação: ${error.response?.data?.error_description || error.message}`);
  }
}

async function autoLogin() {
  let clientId, clientSecret, basicToken;

  if (db) {
    try {
      const doc = await db.collection('hotmart_config').doc('credentials').get();
      if (doc.exists) {
        const data = doc.data();
        clientId = data.clientId;
        clientSecret = data.clientSecret;
        basicToken = data.basicToken;
        console.log('🔐 Credenciais carregadas do Firebase');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar credenciais do Firebase');
    }
  }

  if (!clientId || !clientSecret || !basicToken) {
    clientId = process.env.HOTMART_CLIENT_ID;
    clientSecret = process.env.HOTMART_CLIENT_SECRET;
    basicToken = process.env.HOTMART_BASIC_TOKEN;
  }

  if (!clientId || !clientSecret || !basicToken) {
    console.log('⚠️ Nenhuma credencial configurada');
    return false;
  }

  try {
    await getHotmartToken(clientId, clientSecret, basicToken);
    console.log('✅ Auto-login realizado');
    return true;
  } catch (error) {
    console.error('❌ Erro no auto-login:', error.message);
    return false;
  }
}

async function ensureToken(req, res, next) {
  if (!isTokenValid()) {
    await autoLogin();
    if (!isTokenValid()) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Configure as credenciais via POST /api/hotmart/connect'
      });
    }
  }
  next();
}

// ROTAS

app.get('/', (req, res) => {
  res.json({
    status: 'Sistema Hotmart Online',
    tokenValid: isTokenValid(),
    hasCredentials: !!(tokenStorage.credentials),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/hotmart/connect', async (req, res) => {
  try {
    const { clientId, clientSecret, basicToken } = req.body;
    
    if (!clientId || !clientSecret || !basicToken) {
      return res.status(400).json({ error: 'Credenciais incompletas' });
    }

    const tokenData = await getHotmartToken(clientId, clientSecret, basicToken);
    
    if (db) {
      await db.collection('hotmart_config').doc('credentials').set({
        clientId,
        clientSecret,
        basicToken,
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Credenciais salvas no Firebase');
    }
    
    res.json({
      success: true,
      message: 'Conectado e credenciais salvas',
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ASSINATURAS - SEM parâmetros problemáticos
app.get('/api/hotmart/subscriptions', ensureToken, async (req, res) => {
  try {
    const params = {
      max_results: parseInt(req.query.max_results || req.query.size || 50)
    };
    
    if (req.query.page_token) params.page_token = req.query.page_token;
    if (req.query.status) params.status = req.query.status;
    
    console.log('📊 Buscando assinaturas:', params);

    const response = await axios.get(ENDPOINTS.subscriptions, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: params
    });

    console.log('✅ Assinaturas:', response.data.items?.length || 0);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro assinaturas:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// VENDAS
app.get('/api/hotmart/sales', ensureToken, async (req, res) => {
  try {
    const params = {
      max_results: parseInt(req.query.max_results || req.query.size || 50)
    };

    if (req.query.page_token) params.page_token = req.query.page_token;

    const response = await axios.get(ENDPOINTS.salesHistory, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: params
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro vendas:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// PRODUTOS
app.get('/api/hotmart/products', ensureToken, async (req, res) => {
  try {
    const response = await axios.get(ENDPOINTS.products, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTIFICAÇÕES DE VENDAS (mock - retorna vazio)
app.get('/api/notifications/sales', (req, res) => {
  res.json([]);
});

// NOTIFICAÇÕES DE ATRASOS (mock - retorna vazio)
app.get('/api/notifications/delayed', (req, res) => {
  res.json([]);
});

// TOKEN INFO
app.get('/api/hotmart/token-info', (req, res) => {
  res.json({
    valid: isTokenValid(),
    expiresAt: tokenStorage.expiresAt,
    timeRemaining: tokenStorage.expiresAt ? Math.max(0, tokenStorage.expiresAt - Date.now()) : 0,
    hasCredentialsSaved: !!(tokenStorage.credentials)
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Sistema rodando na porta ${PORT}`);
  console.log('🔐 Tentando auto-login...');
  await autoLogin();
  console.log('✅ Sistema pronto');
});

module.exports = app;