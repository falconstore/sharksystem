// ================================
// BACKEND NODE.JS PARA HOTMART API
// ================================

// package.json
/*
{
  "name": "hotmart-backend",
  "version": "1.0.0",
  "description": "Backend para integração com Hotmart API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2",
    "firebase-admin": "^11.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
*/

// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===== CONFIGURAÇÃO FIREBASE (OPCIONAL) =====
const admin = require('firebase-admin');

// Inicializar Firebase Admin (se usar database)
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  const db = admin.firestore();
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.log('⚠️ Firebase Admin não configurado:', error.message);
}

// ===== ARMAZENAMENTO DE TOKENS =====
let tokenStorage = {
  accessToken: null,
  expiresAt: null
};

// ===== FUNÇÕES UTILITÁRIAS =====

// Verificar se token é válido
function isTokenValid() {
  return tokenStorage.accessToken && tokenStorage.expiresAt > Date.now();
}

// Obter novo token da Hotmart
async function getHotmartToken(clientId, clientSecret, basicToken) {
  try {
    const url = `https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Armazenar token
    tokenStorage = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
    
    // Opcionalmente salvar no Firebase
    if (admin.apps.length > 0) {
      await db.collection('hotmart_config').doc('token').set({
        accessToken: data.access_token,
        expiresAt: tokenStorage.expiresAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    throw error;
  }
}

// ===== ROTAS DA API =====

// Conectar com Hotmart
app.post('/api/hotmart/connect', async (req, res) => {
  try {
    const { clientId, clientSecret, basicToken } = req.body;
    
    if (!clientId || !clientSecret || !basicToken) {
      return res.status(400).json({
        error: 'Credenciais incompletas',
        message: 'Client ID, Client Secret e Basic Token são obrigatórios'
      });
    }

    const tokenData = await getHotmartToken(clientId, clientSecret, basicToken);
    
    res.json({
      success: true,
      message: 'Conectado com sucesso à API da Hotmart',
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in
    });
    
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({
      error: 'Erro de conexão',
      message: error.message
    });
  }
});

// Obter assinaturas
app.get('/api/hotmart/subscriptions', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Faça login novamente'
      });
    }

    // Parâmetros de query
    const { page = 1, size = 20, status, start_date, end_date } = req.query;
    
    let url = `https://api-sec-vlc.hotmart.com/payments/api/v1/subscriptions?page=${page}&size=${size}`;
    
    if (status) url += `&status=${status}`;
    if (start_date) url += `&start_date=${start_date}`;
    if (end_date) url += `&end_date=${end_date}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Opcionalmente salvar no Firebase para cache
    if (admin.apps.length > 0) {
      await db.collection('hotmart_data').doc('subscriptions').set({
        data: data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    res.status(500).json({
      error: 'Erro ao buscar assinaturas',
      message: error.message
    });
  }
});

// Obter vendas
app.get('/api/hotmart/sales', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Faça login novamente'
      });
    }

    const { page = 1, size = 20, status, start_date, end_date } = req.query;
    
    let url = `https://api-sec-vlc.hotmart.com/payments/api/v1/sales?page=${page}&size=${size}`;
    
    if (status) url += `&status=${status}`;
    if (start_date) url += `&start_date=${start_date}`;
    if (end_date) url += `&end_date=${end_date}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache no Firebase
    if (admin.apps.length > 0) {
      await db.collection('hotmart_data').doc('sales').set({
        data: data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({
      error: 'Erro ao buscar vendas',
      message: error.message
    });
  }
});

// Webhook da Hotmart (para receber notificações automáticas)
app.post('/api/hotmart/webhook', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('📨 Webhook recebido:', eventData.event);
    
    // Processar diferentes tipos de eventos
    switch (eventData.event) {
      case 'PURCHASE_COMPLETE':
        await handleNewSale(eventData.data);
        break;
        
      case 'PURCHASE_DELAYED':
        await handleDelayedPayment(eventData.data);
        break;
        
      case 'SUBSCRIPTION_CANCELLATION':
        await handleCancellation(eventData.data);
        break;
        
      case 'PURCHASE_APPROVED':
        await handlePaymentApproved(eventData.data);
        break;
    }
    
    // Salvar evento no Firebase
    if (admin.apps.length > 0) {
      await db.collection('hotmart_webhooks').add({
        event: eventData.event,
        data: eventData.data,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.status(200).json({ message: 'Webhook processado com sucesso' });
    
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== HANDLERS DE EVENTOS =====

async function handleNewSale(data) {
  console.log('🎉 Nova venda:', data.buyer?.name, '- R$', data.price);
  
  if (admin.apps.length > 0) {
    await db.collection('sales_notifications').add({
      type: 'NEW_SALE',
      buyerName: data.buyer?.name,
      buyerEmail: data.buyer?.email,
      price: data.price,
      product: data.product?.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function handleDelayedPayment(data) {
  console.log('⚠️ Pagamento atrasado:', data.buyer?.name);
  
  if (admin.apps.length > 0) {
    await db.collection('payment_alerts').add({
      type: 'DELAYED_PAYMENT',
      buyerName: data.buyer?.name,
      buyerEmail: data.buyer?.email,
      price: data.price,
      daysDelayed: data.days_delayed || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function handleCancellation(data) {
  console.log('❌ Cancelamento:', data.buyer?.name);
  
  if (admin.apps.length > 0) {
    await db.collection('cancellation_alerts').add({
      type: 'CANCELLATION',
      buyerName: data.buyer?.name,
      buyerEmail: data.buyer?.email,
      reason: data.cancellation_reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function handlePaymentApproved(data) {
  console.log('✅ Pagamento aprovado:', data.buyer?.name);
  
  if (admin.apps.length > 0) {
    await db.collection('payment_approved').add({
      type: 'PAYMENT_APPROVED',
      buyerName: data.buyer?.name,
      buyerEmail: data.buyer?.email,
      price: data.price,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// ===== ROTAS DE DADOS EM CACHE (FIREBASE) =====

// Obter notificações de vendas do Firebase
app.get('/api/notifications/sales', async (req, res) => {
  try {
    if (admin.apps.length === 0) {
      return res.status(503).json({ error: 'Firebase não configurado' });
    }
    
    const snapshot = await db.collection('sales_notifications')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(notifications);
    
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter alertas de pagamento do Firebase
app.get('/api/notifications/delayed', async (req, res) => {
  try {
    if (admin.apps.length === 0) {
      return res.status(503).json({ error: 'Firebase não configurado' });
    }
    
    const snapshot = await db.collection('payment_alerts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(alerts);
    
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== MIDDLEWARE DE TRATAMENTO DE ERROS =====
app.use((error, req, res, next) => {
  console.error('Erro no servidor:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   POST /api/hotmart/connect`);
  console.log(`   GET  /api/hotmart/subscriptions`);
  console.log(`   GET  /api/hotmart/sales`);
  console.log(`   POST /api/hotmart/webhook`);
  console.log(`   GET  /api/notifications/sales`);
  console.log(`   GET  /api/notifications/delayed`);
  
  if (admin.apps.length > 0) {
    console.log('✅ Firebase conectado');
  } else {
    console.log('⚠️ Firebase não configurado (opcional)');
  }
});

module.exports = app;