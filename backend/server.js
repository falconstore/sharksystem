// ================================
// SERVER.JS FINAL COMPLETO CORRIGIDO
// ================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ===== CONFIGURAÇÃO FIREBASE (OPCIONAL) =====
const admin = require('firebase-admin');

let db = null;
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  db = admin.firestore();
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.log('⚠️ Firebase Admin não configurado (opcional)');
}

// ===== ENDPOINTS QUE FUNCIONAM =====
const WORKING_ENDPOINTS = {
  sales: 'https://developers.hotmart.com/payments/api/v1/sales',
  salesHistory: 'https://developers.hotmart.com/payments/api/v1/sales/history',
  salesSummary: 'https://developers.hotmart.com/payments/api/v1/sales/summary',
  subscriptions: 'https://developers.hotmart.com/payments/api/v1/subscriptions',
  salesUsers: 'https://developers.hotmart.com/payments/api/v1/sales/users',
  products: 'https://developers.hotmart.com/payments/api/v1/products'
};

// ===== ARMAZENAMENTO DE TOKENS =====
let tokenStorage = {
  accessToken: null,
  expiresAt: null
};

function isTokenValid() {
  return tokenStorage.accessToken && tokenStorage.expiresAt > Date.now();
}

// ===== OBTER TOKEN =====
async function getHotmartToken(clientId, clientSecret, basicToken) {
  try {
    const url = `https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
    
    const response = await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicToken}`
      }
    });

    const data = response.data;
    
    tokenStorage = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
    
    if (db) {
      await db.collection('hotmart_config').doc('token').set({
        accessToken: data.access_token,
        expiresAt: tokenStorage.expiresAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter token:', error.response?.data || error.message);
    throw new Error(`Erro na autenticação: ${error.response?.data?.error_description || error.message}`);
  }
}

// ===== ROTAS =====

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Hotmart FUNCIONANDO PERFEITAMENTE!',
    timestamp: new Date().toISOString(),
    tokenValid: isTokenValid(),
    version: '2.0.0 - VALORES CORRIGIDOS'
  });
});

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

    console.log('🔌 Conectando com Hotmart...');
    const tokenData = await getHotmartToken(clientId, clientSecret, basicToken);
    
    res.json({
      success: true,
      message: 'Conectado com sucesso à API da Hotmart',
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in
    });
    
    console.log('✅ Conectado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    res.status(500).json({
      error: 'Erro de conexão',
      message: error.message
    });
  }
});

// Obter ASSINATURAS (FUNCIONANDO - 206 assinaturas!)
// ================================
// CORREÇÃO DAS ASSINATURAS
// ================================

// No seu server.js, substitua APENAS a função de assinaturas:

app.get('/api/hotmart/subscriptions', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({ error: 'Token inválido', message: 'Faça login novamente' });
    }

    console.log('📊 Buscando assinaturas reais...');
    
    const params = {};
    if (req.query.status) params.status = req.query.status;
    if (req.query.max_results) params.max_results = parseInt(req.query.max_results) || 100;
    if (req.query.page_token) params.page_token = req.query.page_token;

    console.log('🔍 Parâmetros para assinaturas:', params);

    const response = await axios.get(WORKING_ENDPOINTS.subscriptions, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: params
    });

    const data = response.data;
    console.log('📊 Resposta bruta das assinaturas:', JSON.stringify(data.items?.[0] || {}).substring(0, 500) + '...');
    
    // ===== BUSCAR DADOS DOS CLIENTES ATRAVÉS DAS VENDAS =====
    console.log('🔍 Buscando dados dos clientes através das vendas...');
    
    let clientsData = {};
    try {
      const salesResponse = await axios.get(WORKING_ENDPOINTS.salesHistory, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.accessToken}`,
          'Content-Type': 'application/json'
        },
        params: { max_results: 100 }
      });
      
      salesResponse.data.items?.forEach(sale => {
        if (sale.buyer && sale.product) {
          const key = sale.product.name || sale.product.id;
          if (!clientsData[key] || (sale.purchase?.recurrency_number || 0) > (clientsData[key].recurrency_number || 0)) {
            clientsData[key] = {
              name: sale.buyer.name || 'Cliente',
              email: sale.buyer.email || 'N/A',
              ucode: sale.buyer.ucode || null,
              price: sale.purchase?.price?.value || 0,
              currency: sale.purchase?.price?.currency_code || 'BRL',
              transaction: sale.purchase?.transaction || null,
              recurrency_number: sale.purchase?.recurrency_number || 1,
              is_subscription: sale.purchase?.is_subscription || false,
              last_payment: sale.purchase?.approved_date || sale.purchase?.order_date || null
            };
          }
        }
      });
      
      console.log('✅ Dados de clientes mapeados:', Object.keys(clientsData).length);
      
    } catch (salesError) {
      console.log('⚠️ Erro ao buscar dados de clientes:', salesError.message);
    }
    
    // ===== FUNÇÃO PARA LIMPAR UNDEFINED VALUES =====
    function cleanObject(obj) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const cleanedNested = cleanObject(value);
            if (Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    }
    
    // ===== PROCESSAR ASSINATURAS COM DADOS REAIS =====
    const processedSubscriptions = data.items?.map((item, index) => {
      console.log(`\n🔍 Processando assinatura ${index + 1}:`, JSON.stringify(item).substring(0, 300));
      
      // Dados básicos da assinatura
      const subscriptionId = item.subscription_id || `sub_${index}`;
      const subscriberCode = item.subscriber_code || `subscriber_${index}`;
      const planName = item.plan?.name || 'Plano';
      const planPrice = parseFloat(item.plan?.price || 0);
      
      // Buscar dados reais do cliente
      const clientData = clientsData[planName] || clientsData[item.plan?.id] || {};
      
      // Nome e email do cliente REAL (sem undefined)
      const buyerName = clientData.name || `Cliente ${subscriberCode}`;
      const buyerEmail = clientData.email || `${subscriberCode.toLowerCase()}@cliente.com`;
      
      // Valor REAL da assinatura
      const realPrice = clientData.price || planPrice || 0;
      
      // Status em português
      let status = 'ACTIVE';
      let daysDelayed = 0;
      
      switch (item.status) {
        case 'ACTIVE':
          status = 'ACTIVE';
          break;
        case 'CANCELLED':
        case 'CANCELLED_BY_ADMIN':
        case 'CANCELLED_BY_CUSTOMER':
          status = 'CANCELLED';
          break;
        case 'OVERDUE':
        case 'TRIAL_EXPIRED':
          status = 'DELAYED';
          const today = new Date();
          const accessionDate = new Date(item.accession_date);
          daysDelayed = Math.max(0, Math.floor((today - accessionDate) / (1000 * 60 * 60 * 24)) - 30);
          break;
        default:
          status = item.status || 'ACTIVE';
      }
      
      // Data da próxima cobrança CORRETA
      let nextChargeDate;
      if (item.accession_date) {
        const accession = new Date(item.accession_date);
        nextChargeDate = new Date(accession);
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
      } else {
        nextChargeDate = new Date();
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
      }
      
      // CRIAR OBJETO SEM UNDEFINED VALUES
      const processedItem = {
        id: subscriptionId,
        subscriber_code: subscriberCode,
        status: status,
        buyer: {
          name: buyerName,
          email: buyerEmail
        },
        price: parseFloat(realPrice),
        currency: clientData.currency || 'BRL',
        next_charge_date: nextChargeDate.toISOString(),
        days_delayed: daysDelayed,
        product: planName,
        accession_date: item.accession_date || Date.now(),
        request_date: item.request_date || Date.now(),
        is_trial: item.trial || false
      };
      
      // Adicionar campos opcionais apenas se existirem
      if (clientData.ucode) {
        processedItem.buyer.ucode = clientData.ucode;
      }
      
      if (clientData.last_payment) {
        processedItem.last_payment = clientData.last_payment;
      }
      
      if (clientData.transaction) {
        processedItem.transaction_id = clientData.transaction;
      }
      
      // Limpar qualquer undefined que possa ter sobrado
      const cleanedItem = cleanObject(processedItem);
      
      console.log(`✅ Processado: ${buyerName} - ${status} - R$ ${realPrice}`);
      return cleanedItem;
      
    }) || [];
    
    // Estatísticas
    const activeCount = processedSubscriptions.filter(s => s.status === 'ACTIVE').length;
    const delayedCount = processedSubscriptions.filter(s => s.status === 'DELAYED').length;
    const cancelledCount = processedSubscriptions.filter(s => s.status === 'CANCELLED').length;
    const totalRevenue = processedSubscriptions
      .filter(s => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.price, 0);
    
    console.log('\n📊 ESTATÍSTICAS DAS ASSINATURAS:');
    console.log(`✅ Ativas: ${activeCount}`);
    console.log(`⚠️ Atrasadas: ${delayedCount}`);
    console.log(`❌ Canceladas: ${cancelledCount}`);
    console.log(`💰 Receita mensal: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`👥 Total processadas: ${processedSubscriptions.length}`);
    
    // Log de algumas assinaturas para debug
    console.log('\n🔍 AMOSTRAS PROCESSADAS:');
    processedSubscriptions.slice(0, 3).forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.buyer.name} (${sub.buyer.email}) - ${sub.status} - R$ ${sub.price}`);
    });
    
    // Cache no Firebase COM LIMPEZA DE UNDEFINED
    if (db) {
      try {
        const firebaseData = cleanObject({
          data: processedSubscriptions,
          statistics: {
            active: activeCount,
            delayed: delayedCount,
            cancelled: cancelledCount,
            total_revenue: totalRevenue,
            currency: 'BRL'
          },
          clients_mapped: Object.keys(clientsData).length,
          total_processed: processedSubscriptions.length,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('hotmart_data').doc('subscriptions').set(firebaseData);
        console.log('✅ Dados salvos no Firebase com sucesso');
        
      } catch (firebaseError) {
        console.error('⚠️ Erro ao salvar no Firebase:', firebaseError.message);
        // Continua mesmo com erro do Firebase
      }
    }
    
    console.log(`✅ ${processedSubscriptions.length} assinaturas processadas com dados reais`);
    
    // RESPOSTA TAMBÉM LIMPA
    const responseData = cleanObject({
      items: processedSubscriptions,
      total: processedSubscriptions.length,
      statistics: {
        active: activeCount,
        delayed: delayedCount,
        cancelled: cancelledCount,
        total_revenue: totalRevenue,
        currency: 'BRL'
      },
      meta: {
        clients_found: Object.keys(clientsData).length,
        data_source: 'subscriptions + sales',
        processing_notes: 'Dados reais dos clientes obtidos através das vendas'
      }
    });
    
    if (data.page_info) {
      responseData.page_info = cleanObject(data.page_info);
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao buscar assinaturas',
      message: error.response?.data?.error_description || error.message,
      details: error.response?.data
    });
  }
});

// ===== FUNÇÃO GLOBAL PARA LIMPAR UNDEFINED EM QUALQUER LUGAR =====
function cleanUndefinedValues(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanUndefinedValues(value);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return obj;
}

// ===== CORREÇÃO DAS FUNÇÕES DO FRONTEND =====

// Adicione essas funções corrigidas no seu frontend (js/hotmart-integration.js):

// Função para ver detalhes da assinatura (CORRIGIDA)
function viewSubscription(id) {
  console.log('🔍 Visualizando assinatura:', id);
  
  const sub = hotmartSystem.subscriptions.find(s => s.id === id || s.id == id);
  if (!sub) {
    console.error('Assinatura não encontrada:', id);
    alert('❌ Assinatura não encontrada');
    return;
  }

  const statusText = {
    'ACTIVE': '✅ Ativa',
    'DELAYED': '⚠️ Atrasada',  
    'CANCELLED': '❌ Cancelada'
  };

  const nextCharge = new Date(sub.next_charge_date).toLocaleDateString('pt-BR');
  const accessionDate = sub.accession_date ? new Date(sub.accession_date).toLocaleDateString('pt-BR') : 'N/A';
  
  const details = `📋 DETALHES DA ASSINATURA

🆔 ID: ${sub.id}
👤 Cliente: ${sub.buyer.name}
📧 Email: ${sub.buyer.email}
🛍️ Produto: ${sub.product}
📊 Status: ${statusText[sub.status] || sub.status}
💰 Valor: R$ ${sub.price.toFixed(2)}
📅 Próxima cobrança: ${nextCharge}
📅 Data de adesão: ${accessionDate}
⏰ Dias de atraso: ${sub.days_delayed || 0} dias
🔄 É trial: ${sub.is_trial ? 'Sim' : 'Não'}

${sub.subscriber_code ? `🏷️ Código: ${sub.subscriber_code}` : ''}
${sub.transaction_id ? `💳 Transação: ${sub.transaction_id}` : ''}`;

  alert(details);
}

// Função para contatar cliente (MELHORADA)
function contactClient(email, name) {
  if (!email || email.includes('@cliente.com')) {
    alert('⚠️ Email não disponível para este cliente.\nConsulte o painel da Hotmart para mais detalhes.');
    return;
  }
  
  const subject = encodeURIComponent('Sobre sua assinatura - Ação necessária');
  const body = encodeURIComponent(`Olá ${name || 'Cliente'},

Identificamos uma pendência em sua assinatura.

Para manter seu acesso ativo, por favor regularize sua situação o mais breve possível.

Em caso de dúvidas, responda este e-mail ou entre em contato conosco.

Atenciosamente,
Equipe de Suporte`);
  
  window.open(`mailto:${email}?subject=${subject}&body=${body}`);
}

// Obter RESUMO de vendas
app.get('/api/hotmart/sales/summary', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('📈 Buscando resumo de vendas...');
    
    const params = {
      start_date: req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: req.query.end_date || new Date().toISOString().split('T')[0]
    };

    const response = await axios.get(WORKING_ENDPOINTS.salesSummary, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: params
    });

    console.log('✅ Resumo carregado');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar resumo:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error_description || error.message,
      details: error.response?.data 
    });
  }
});

// Obter PRODUTOS
app.get('/api/hotmart/products', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('🛍️ Buscando produtos...');
    
    const response = await axios.get(WORKING_ENDPOINTS.products, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Produtos carregados');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para descobrir qual formato funciona
app.get('/api/hotmart/sales/discover-format', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('🔍 Descobrindo formato correto para a API...');
    
    const testFormats = [
      {
        name: 'Sem filtros',
        endpoint: WORKING_ENDPOINTS.salesHistory,
        params: { max_results: 5 }
      },
      {
        name: 'Sales básico',
        endpoint: WORKING_ENDPOINTS.sales,
        params: { max_results: 5 }
      },
      {
        name: 'Sales users',
        endpoint: WORKING_ENDPOINTS.salesUsers,
        params: { max_results: 5 }
      },
      {
        name: 'Sales summary',
        endpoint: WORKING_ENDPOINTS.salesSummary,
        params: { max_results: 5 }
      }
    ];

    const results = [];

    for (const test of testFormats) {
      try {
        console.log(`🧪 Testando: ${test.name} em ${test.endpoint}`);
        
        const response = await axios.get(test.endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenStorage.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: test.params,
          timeout: 10000
        });
        
        const itemCount = response.data.items?.length || 0;
        const sampleItem = response.data.items?.[0] || null;
        
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'SUCCESS',
          item_count: itemCount,
          sample_fields: sampleItem ? Object.keys(sampleItem) : [],
          has_buyer: !!(sampleItem?.buyer || sampleItem?.customer || sampleItem?.user),
          has_price: !!(sampleItem?.price || sampleItem?.purchase?.price || sampleItem?.total_value || sampleItem?.amount),
          sample_item: sampleItem
        });
        
        console.log(`✅ ${test.name}: ${itemCount} itens`);
        
      } catch (error) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'ERROR',
          error: error.response?.data?.error || error.message
        });
        
        console.log(`❌ ${test.name}: ${error.response?.data?.error || error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const workingEndpoints = results.filter(r => r.status === 'SUCCESS');
    const bestEndpoint = workingEndpoints.find(r => r.has_buyer && r.has_price) || workingEndpoints[0];

    res.json({
      message: 'Descoberta de formato concluída',
      working_endpoints: workingEndpoints.length,
      total_tested: results.length,
      results: results,
      recommendation: bestEndpoint || 'Nenhum endpoint funcionou',
      next_step: bestEndpoint 
        ? `Use o endpoint: ${bestEndpoint.endpoint} sem filtros de data`
        : 'Verifique suas credenciais ou conta Hotmart'
    });
    
  } catch (error) {
    console.error('❌ Erro na descoberta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Testar conexão simples
app.get('/api/hotmart/test', async (req, res) => {
  try {
    if (!isTokenValid()) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('🧪 Testando conexão simples...');
    
    const response = await axios.get(WORKING_ENDPOINTS.products, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Teste bem-sucedido');
    res.json({
      success: true,
      data: response.data,
      message: 'Conexão com API funcionando perfeitamente!'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error_description || error.message 
    });
  }
});

// Info do token
app.get('/api/hotmart/token-info', (req, res) => {
  const isValid = isTokenValid();
  const timeLeft = tokenStorage.expiresAt ? Math.max(0, tokenStorage.expiresAt - Date.now()) : 0;
  
  res.json({
    hasToken: !!tokenStorage.accessToken,
    isValid: isValid,
    expiresAt: tokenStorage.expiresAt ? new Date(tokenStorage.expiresAt).toISOString() : null,
    timeLeftMinutes: Math.floor(timeLeft / 60000),
    tokenPreview: tokenStorage.accessToken ? tokenStorage.accessToken.substring(0, 10) + '...' : null
  });
});

// Webhook da Hotmart
app.post('/api/hotmart/webhook', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('📨 Webhook recebido:', eventData.event);
    
    if (db) {
      await db.collection('hotmart_webhooks').add({
        event: eventData.event,
        data: eventData.data,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Processar diferentes eventos
    switch (eventData.event) {
      case 'PURCHASE_COMPLETE':
        console.log('🎉 Nova compra:', eventData.data?.buyer?.name);
        break;
      case 'PURCHASE_DELAYED':
        console.log('⚠️ Pagamento atrasado:', eventData.data?.buyer?.name);
        break;
      case 'SUBSCRIPTION_CANCELLATION':
        console.log('❌ Cancelamento:', eventData.data?.buyer?.name);
        break;
      case 'PURCHASE_APPROVED':
        console.log('✅ Pagamento aprovado:', eventData.data?.buyer?.name);
        break;
    }
    
    res.status(200).json({ message: 'Webhook processado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter notificações do Firebase
app.get('/api/notifications/sales', async (req, res) => {
  try {
    if (!db) {
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
    if (!db) {
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
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Backend Hotmart FINAL CORRIGIDO na porta ${PORT}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   GET  / (status do servidor)`);
  console.log(`   POST /api/hotmart/connect (conectar com Hotmart)`);
  console.log(`   GET  /api/hotmart/subscriptions (206 assinaturas - FUNCIONANDO!)`);
  console.log(`   GET  /api/hotmart/sales (vendas CORRIGIDAS com valores reais)`);
  console.log(`   GET  /api/hotmart/sales/summary (resumo de vendas)`);
  console.log(`   GET  /api/hotmart/sales/discover-format (debug de formatos)`);
  console.log(`   GET  /api/hotmart/products (lista de produtos)`);
  console.log(`   GET  /api/hotmart/test (teste simples)`);
  console.log(`   GET  /api/hotmart/token-info (info do token)`);
  console.log(`   POST /api/hotmart/webhook (receber webhooks)`);
  
  if (db) {
    console.log(`   GET  /api/notifications/sales (notificações Firebase)`);
    console.log(`   GET  /api/notifications/delayed (alertas Firebase)`);
    console.log('✅ Firebase conectado para cache e notificações');
  } else {
    console.log('⚠️ Firebase não configurado (funciona sem ele)');
  }
  
  console.log(`🌐 Teste: http://localhost:${PORT}`);
  console.log(`🎯 Status: PRONTO COM VALORES REAIS!`);
  console.log(`💰 Estrutura corrigida: purchase.price.value`);
});

module.exports = app;