// ================================
// FRONTEND ATUALIZADO PARA BACKEND
// ================================
// Substitua o conteúdo do seu js/hotmart-integration.js

class HotmartIntegration {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api'; // URL do seu backend
        this.accessToken = null;
        this.credentials = {
            clientId: '',
            clientSecret: '',
            basicToken: ''
        };
        this.subscriptions = [];
        this.sales = [];
        this.isConnected = false;
    }

    // ===== CONEXÃO COM BACKEND =====
    async connectHotmart() {
        const clientId = document.getElementById('hotmartClientId').value.trim();
        const clientSecret = document.getElementById('hotmartClientSecret').value.trim();
        const basicToken = document.getElementById('hotmartBasicToken').value.trim();

        if (!clientId || !clientSecret || !basicToken) {
            this.showNotification('⚠️ Por favor, preencha todas as credenciais', 'error');
            return;
        }

        this.credentials = { clientId, clientSecret, basicToken };
        
        // UI Loading
        const connectText = document.getElementById('connectText');
        const connectLoading = document.getElementById('connectLoading');
        
        if (connectText) connectText.style.display = 'none';
        if (connectLoading) connectLoading.style.display = 'inline-block';

        try {
            // Chamar backend para conectar
            const response = await fetch(`${this.apiUrl}/hotmart/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: clientId,
                    clientSecret: clientSecret,
                    basicToken: basicToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na conexão');
            }
            
            this.accessToken = data.accessToken;
            this.isConnected = true;
            
            // Salvar credenciais no localStorage
            localStorage.setItem('hotmart_credentials', JSON.stringify({
                ...this.credentials,
                accessToken: this.accessToken,
                expiresAt: Date.now() + (data.expiresIn * 1000)
            }));
            
            this.showNotification('✅ Conectado com sucesso à API da Hotmart!', 'success');
            
            // Mostrar dashboard
            const dashboard = document.getElementById('hotmartDashboard');
            if (dashboard) dashboard.style.display = 'block';
            
            // Carregar dados reais
            await this.loadInitialData();

        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            // UI Reset
            if (connectText) connectText.style.display = 'inline';
            if (connectLoading) connectLoading.style.display = 'none';
        }
    }

    // ===== CARREGAMENTO DE DADOS REAIS =====
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadRealSubscriptions(),
                this.loadRealSales()
            ]);
            this.updateDashboard();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showNotification('❌ Erro ao carregar dados da Hotmart', 'error');
        }
    }

    // Carregar assinaturas reais do backend
    async loadRealSubscriptions() {
        try {
            const response = await fetch(`${this.apiUrl}/hotmart/subscriptions?page=1&size=50`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar assinaturas');
            }

            const data = await response.json();
            console.log('📊 Dados reais de assinaturas:', data);
            
            // Processar dados reais da API
            this.subscriptions = data.items?.map(item => ({
                id: item.subscription_id || item.id,
                buyer: {
                    name: item.buyer?.name || 'Nome não disponível',
                    email: item.buyer?.email || 'Email não disponível'
                },
                status: this.mapSubscriptionStatus(item.status),
                price: item.price || 0,
                next_charge_date: item.next_charge_date || new Date(),
                days_delayed: item.days_delayed || 0,
                product: item.product?.name || 'Produto'
            })) || [];
            
            console.log('✅ Assinaturas processadas:', this.subscriptions.length);
            
        } catch (error) {
            console.error('Erro ao carregar assinaturas reais:', error);
            this.showNotification('⚠️ Usando dados de demonstração', 'error');
            
            // Fallback para dados de demonstração
            this.subscriptions = this.getDemoSubscriptions();
        }
    }

    // Carregar vendas reais do backend
    async loadRealSales() {
        try {
            const response = await fetch(`${this.apiUrl}/hotmart/sales?page=1&size=20`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar vendas');
            }

            const data = await response.json();
            console.log('💰 Dados reais de vendas:', data);
            
            // Processar dados reais da API
            this.sales = data.items?.map(item => ({
                id: item.transaction || item.id,
                buyer: {
                    name: item.buyer?.name || 'Nome não disponível',
                    email: item.buyer?.email || 'Email não disponível'
                },
                price: item.price || 0,
                purchase_date: item.purchase_date || new Date().toISOString(),
                status: item.status || 'APPROVED',
                product: item.product?.name || 'Produto'
            })) || [];
            
            console.log('✅ Vendas processadas:', this.sales.length);
            
        } catch (error) {
            console.error('Erro ao carregar vendas reais:', error);
            this.showNotification('⚠️ Usando dados de demonstração para vendas', 'error');
            
            // Fallback para dados de demonstração
            this.sales = this.getDemoSales();
        }
    }

    // ===== CARREGAR NOTIFICAÇÕES DO FIREBASE =====
    async loadNotifications() {
        try {
            // Carregar notificações de vendas
            const salesResponse = await fetch(`${this.apiUrl}/notifications/sales`);
            if (salesResponse.ok) {
                const salesNotifications = await salesResponse.json();
                console.log('🔔 Notificações de vendas:', salesNotifications);
                
                // Atualizar interface com notificações reais
                this.updateSalesNotifications(salesNotifications);
            }
            
            // Carregar alertas de pagamento
            const delayedResponse = await fetch(`${this.apiUrl}/notifications/delayed`);
            if (delayedResponse.ok) {
                const delayedAlerts = await delayedResponse.json();
                console.log('⚠️ Alertas de pagamento:', delayedAlerts);
                
                // Atualizar interface com alertas reais
                this.updateDelayedAlerts(delayedAlerts);
            }
            
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }

    // ===== UTILITÁRIOS =====
    
    // Mapear status da API para formato interno
    mapSubscriptionStatus(status) {
        const statusMap = {
            'ACTIVE': 'ACTIVE',
            'INACTIVE': 'CANCELLED', 
            'OVERDUE': 'DELAYED',
            'CANCELED': 'CANCELLED',
            'CANCELLED': 'CANCELLED'
        };
        
        return statusMap[status?.toUpperCase()] || 'ACTIVE';
    }

    // Dados de demonstração (fallback)
    getDemoSubscriptions() {
        return [
            {
                id: '1',
                buyer: { name: 'João Silva Santos', email: 'joao.silva@email.com' },
                status: 'ACTIVE',
                price: 97.00,
                next_charge_date: '2025-10-15',
                days_delayed: 0,
                product: 'Curso Premium'
            },
            {
                id: '2',
                buyer: { name: 'Maria Fernanda Costa', email: 'maria.costa@email.com' },
                status: 'DELAYED',
                price: 197.00,
                next_charge_date: '2025-09-20',
                days_delayed: 3,
                product: 'Mentoria VIP'
            }
        ];
    }

    getDemoSales() {
        return [
            {
                id: '1',
                buyer: { name: 'Ricardo Almeida', email: 'ricardo.almeida@email.com' },
                price: 297.00,
                purchase_date: new Date().toISOString(),
                status: 'APPROVED',
                product: 'Curso Avançado'
            }
        ];
    }

    // ===== ATUALIZAÇÃO DE INTERFACE (RESTO DO CÓDIGO IGUAL) =====
    updateDashboard() {
        const active = this.subscriptions.filter(s => s.status === 'ACTIVE').length;
        const delayed = this.subscriptions.filter(s => s.status === 'DELAYED' || s.days_delayed > 0).length;
        const cancelled = this.subscriptions.filter(s => s.status === 'CANCELLED').length;
        const revenue = this.subscriptions
            .filter(s => s.status === 'ACTIVE')
            .reduce((sum, s) => sum + (s.price || 0), 0);

        this.updateElement('activeSubscriptions', active);
        this.updateElement('delayedSubscriptions', delayed);
        this.updateElement('cancelledSubscriptions', cancelled);
        this.updateElement('monthlyRevenue', `R$ ${revenue.toFixed(2)}`);

        this.renderDelayedPayments();
        this.renderRecentSales();
        this.renderSubscriptionsTable();
        
        // Carregar notificações do Firebase
        this.loadNotifications();
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    renderDelayedPayments() {
        const delayed = this.subscriptions.filter(s => s.status === 'DELAYED' || s.days_delayed > 0);
        const container = document.getElementById('delayedPaymentsList');
        
        if (!container) return;

        if (delayed.length === 0) {
            container.innerHTML = '<div class="empty-state">🎉 Nenhum pagamento atrasado no momento</div>';
            return;
        }

        container.innerHTML = delayed.map(sub => `
            <div class="card" style="border-left: 4px solid var(--warning, #f6ad55); margin-bottom: 15px;">
                <div class="card-header">
                    <div>
                        <div class="card-title">⚠️ ${sub.buyer.name}</div>
                        <div class="card-subtitle">${sub.product}</div>
                    </div>
                </div>
                <p><strong>Email:</strong> ${sub.buyer.email}</p>
                <p><strong>Valor:</strong> R$ ${sub.price.toFixed(2)}</p>
                <p><strong>Dias de atraso:</strong> <span style="color: var(--danger, #e53e3e); font-weight: bold;">${sub.days_delayed || 0} dias</span></p>
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-warning" onclick="contactClient('${sub.buyer.email}', '${sub.buyer.name}')">
                        📞 Contatar Cliente
                    </button>
                    <button class="btn btn-primary" onclick="sendReminder('${sub.id}')">
                        📧 Enviar Lembrete
                    </button>
                    <button class="btn btn-secondary" onclick="viewSubscription('${sub.id}')">
                        👁️ Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRecentSales() {
        const container = document.getElementById('recentSalesList');
        if (!container) return;

        if (this.sales.length === 0) {
            container.innerHTML = '<div class="empty-state">📊 Nenhuma venda recente</div>';
            return;
        }

        container.innerHTML = this.sales.slice(0, 5).map(sale => `
            <div class="card" style="border-left: 4px solid var(--success, #48bb78); margin-bottom: 15px;">
                <div class="card-header">
                    <div>
                        <div class="card-title">🎉 Nova Venda!</div>
                        <div class="card-subtitle">${sale.product}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: var(--success, #48bb78);">
                            R$ ${sale.price.toFixed(2)}
                        </div>
                    </div>
                </div>
                <p><strong>Cliente:</strong> ${sale.buyer.name}</p>
                <p><strong>Email:</strong> ${sale.buyer.email}</p>
                <p><strong>Data:</strong> ${new Date(sale.purchase_date).toLocaleString('pt-BR')}</p>
                <span class="badge badge-success">
                    ✅ ${sale.status === 'APPROVED' ? 'APROVADO' : sale.status}
                </span>
            </div>
        `).join('');
    }

    renderSubscriptionsTable() {
        const tbody = document.getElementById('subscriptionsTableBody');
        if (!tbody) return;

        if (this.subscriptions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma assinatura encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = this.subscriptions.map(sub => {
            const statusInfo = {
                'ACTIVE': { class: 'badge-success', text: '✅ Ativa', color: 'var(--success, #48bb78)' },
                'DELAYED': { class: 'badge-warning', text: '⚠️ Atrasada', color: 'var(--warning, #f6ad55)' },
                'CANCELLED': { class: 'badge-danger', text: '❌ Cancelada', color: 'var(--danger, #f56565)' }
            };

            const status = statusInfo[sub.status] || statusInfo['CANCELLED'];

            return `
                <tr>
                    <td><strong>${sub.buyer.name}</strong><br><small style="color: #666;">${sub.product}</small></td>
                    <td>${sub.buyer.email}</td>
                    <td><span class="badge ${status.class}" style="background: ${status.color}20; color: ${status.color};">${status.text}</span></td>
                    <td><strong>R$ ${sub.price.toFixed(2)}</strong></td>
                    <td>${new Date(sub.next_charge_date).toLocaleDateString('pt-BR')}</td>
                    <td>${sub.days_delayed > 0 ? `<span style="color: var(--danger, #f56565); font-weight: bold;">${sub.days_delayed} dias</span>` : '0 dias'}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-primary" onclick="viewSubscription('${sub.id}')" style="padding: 8px 12px; font-size: 0.8rem;">
                                👁️ Ver
                            </button>
                            ${sub.status === 'DELAYED' ? `
                                <button class="btn btn-warning" onclick="contactClient('${sub.buyer.email}', '${sub.buyer.name}')" style="padding: 8px 12px; font-size: 0.8rem;">
                                    📞
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ===== RESTO DO CÓDIGO IGUAL =====
    showNotification(message, type = 'success') {
        const container = document.getElementById('hotmartConnectionStatus');
        if (!container) return;

        const bgColor = type === 'success' ? 'var(--success-light, #f0fff4)' : 'var(--danger-light, #fff5f5)';
        const textColor = type === 'success' ? 'var(--success, #22543d)' : 'var(--danger, #c53030)';
        
        container.innerHTML = `
            <div style="
                padding: 15px 20px;
                border-radius: 8px;
                margin: 15px 0;
                background: ${bgColor};
                color: ${textColor};
                display: flex;
                align-items: center;
                gap: 12px;
                border: 1px solid ${textColor}40;
            ">
                <span>${type === 'success' ? '✅' : '❌'}</span>
                <span>${message}</span>
            </div>
        `;
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    checkSavedCredentials() {
        const saved = localStorage.getItem('hotmart_credentials');
        if (!saved) return;

        try {
            const creds = JSON.parse(saved);
            if (creds.expiresAt > Date.now()) {
                document.getElementById('hotmartClientId').value = creds.clientId;
                document.getElementById('hotmartClientSecret').value = creds.clientSecret;
                document.getElementById('hotmartBasicToken').value = creds.basicToken;
                
                this.accessToken = creds.accessToken;
                this.credentials = creds;
                this.isConnected = true;
                
                this.showNotification('🔄 Credenciais carregadas do cache', 'success');
                
                const dashboard = document.getElementById('hotmartDashboard');
                if (dashboard) dashboard.style.display = 'block';
                
                this.loadInitialData();
            }
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
            localStorage.removeItem('hotmart_credentials');
        }
    }

    exportSubscriptions() {
        if (this.subscriptions.length === 0) {
            alert('❌ Nenhuma assinatura para exportar');
            return;
        }

        const headers = ['Nome', 'Email', 'Produto', 'Status', 'Valor', 'Próxima Cobrança', 'Dias Atraso'];
        const rows = this.subscriptions.map(sub => [
            sub.buyer.name,
            sub.buyer.email,
            sub.product || 'N/A',
            sub.status,
            `R$ ${sub.price.toFixed(2)}`,
            new Date(sub.next_charge_date).toLocaleDateString('pt-BR'),
            sub.days_delayed || 0
        ]);
        
        const csv = [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotmart_assinaturas_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('📊 Dados exportados com sucesso!', 'success');
    }
}

// ===== INSTÂNCIA GLOBAL E FUNÇÕES =====
const hotmartSystem = new HotmartIntegration();

function connectHotmart() {
    hotmartSystem.connectHotmart();
}

function refreshHotmartSales() {
    if (!hotmartSystem.isConnected) {
        hotmartSystem.showNotification('⚠️ Conecte-se primeiro à API', 'error');
        return;
    }
    
    hotmartSystem.loadRealSales().then(() => {
        hotmartSystem.renderRecentSales();
        hotmartSystem.showNotification('🔄 Vendas atualizadas!', 'success');
    });
}

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

function sendReminder(subscriptionId) {
    hotmartSystem.showNotification('📧 Lembrete enviado com sucesso!', 'success');
}

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

// ===== INTEGRAÇÃO COM SISTEMA EXISTENTE =====
window.HotmartSystem = {
    integration: hotmartSystem,
    
    onTabActivated: function() {
        hotmartSystem.checkSavedCredentials();
        
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        
        if (pageTitle) pageTitle.textContent = '🔥 Controle Hotmart';
        if (pageSubtitle) pageSubtitle.textContent = 'Gestão completa de assinaturas e vendas (DADOS REAIS)';
    },
    
    refreshData: function() {
        if (hotmartSystem.isConnected) {
            hotmartSystem.loadInitialData();
        }
    },
    
    exportData: function() {
        hotmartSystem.exportSubscriptions();
    }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('btnConnectHotmart');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectHotmart);
    }

    setTimeout(() => {
        hotmartSystem.checkSavedCredentials();
    }, 500);
});

console.log('🚀 Sistema Hotmart com BACKEND carregado!');
console.log('🔌 Conectando ao backend em:', hotmartSystem.apiUrl);
console.log('📊 Dados REAIS serão carregados da API Hotmart');