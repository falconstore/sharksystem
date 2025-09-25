// ================================
// HOTMART INTEGRATION - VENDAS VS RENOVAÇÕES
// ================================

class HotmartIntegration {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api';
        this.subscriptions = [];
        this.sales = [];
        this.newSales = [];
        this.renewals = [];
    }

    async init() {
        console.log('🚀 Iniciando integração Hotmart...');
        await this.loadData();
        this.updateDashboard();
    }

    async loadData() {
        try {
            await this.loadRealSales();
            await this.loadRealSubscriptions();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    async loadRealSales() {
        try {
            const response = await fetch(`${this.apiUrl}/hotmart/sales?page=1&size=50`);
            if (!response.ok) throw new Error('Erro ao carregar vendas');

            const data = await response.json();
            console.log('💰 Vendas recebidas:', data);
            
            this.sales = data.items || [];
            this.newSales = this.sales.filter(s => s.transaction_type === 'NEW_SALE');
            this.renewals = this.sales.filter(s => s.transaction_type === 'RENEWAL');
            
            console.log(`✅ Total: ${this.sales.length} | Vendas Novas: ${this.newSales.length} | Renovações: ${this.renewals.length}`);
            
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        }
    }

    async loadRealSubscriptions() {
        try {
            const response = await fetch(`${this.apiUrl}/hotmart/subscriptions`);
            if (!response.ok) throw new Error('Erro ao carregar assinaturas');

            const data = await response.json();
            this.subscriptions = data.items || [];
            console.log('📊 Assinaturas carregadas:', this.subscriptions.length);
            
        } catch (error) {
            console.error('Erro ao carregar assinaturas:', error);
        }
    }

    updateDashboard() {
        // Atualizar cards de vendas
        this.updateElement('totalSales', this.sales.length);
        this.updateElement('newSalesCount', this.newSales.length);
        this.updateElement('renewalsCount', this.renewals.length);
        
        // Atualizar receita
        const totalRevenue = this.sales.reduce((sum, s) => sum + s.price, 0);
        const newSalesRevenue = this.newSales.reduce((sum, s) => sum + s.price, 0);
        const renewalsRevenue = this.renewals.reduce((sum, s) => sum + s.price, 0);
        
        this.updateElement('totalRevenue', `R$ ${totalRevenue.toFixed(2)}`);
        this.updateElement('newSalesRevenue', `R$ ${newSalesRevenue.toFixed(2)}`);
        this.updateElement('renewalsRevenue', `R$ ${renewalsRevenue.toFixed(2)}`);
        
        // Renderizar listas
        this.renderSalesByType();
        this.renderAllSales();
    }

    renderSalesByType() {
        // Container de vendas novas
        const newSalesContainer = document.getElementById('newSalesList');
        if (newSalesContainer) {
            if (this.newSales.length === 0) {
                newSalesContainer.innerHTML = '<div class="empty-state">📊 Nenhuma venda nova hoje</div>';
            } else {
                newSalesContainer.innerHTML = this.newSales.slice(0, 5).map(sale => this.renderSaleCard(sale, '🎉', 'success')).join('');
            }
        }
        
        // Container de renovações
        const renewalsContainer = document.getElementById('renewalsList');
        if (renewalsContainer) {
            if (this.renewals.length === 0) {
                renewalsContainer.innerHTML = '<div class="empty-state">🔄 Nenhuma renovação hoje</div>';
            } else {
                renewalsContainer.innerHTML = this.renewals.slice(0, 5).map(sale => this.renderSaleCard(sale, '🔄', 'info')).join('');
            }
        }
    }

    renderAllSales() {
        const container = document.getElementById('allSalesList');
        if (!container) return;

        if (this.sales.length === 0) {
            container.innerHTML = '<div class="empty-state">📊 Nenhuma venda registrada</div>';
            return;
        }

        // Ordenar por data (mais recente primeiro)
        const sortedSales = [...this.sales].sort((a, b) => {
            const dateA = new Date(a.purchase_date).getTime();
            const dateB = new Date(b.purchase_date).getTime();
            return dateB - dateA;
        });

        container.innerHTML = sortedSales.map(sale => {
            const isRenewal = sale.transaction_type === 'RENEWAL';
            const icon = isRenewal ? '🔄' : '🎉';
            const color = isRenewal ? 'info' : 'success';
            const label = isRenewal ? `Renovação ${sale.recurrency_number}ª` : 'Venda Nova';
            
            return this.renderSaleCard(sale, icon, color, label);
        }).join('');
    }

    renderSaleCard(sale, icon, colorClass, customLabel = null) {
        const date = new Date(sale.purchase_date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const label = customLabel || (sale.transaction_type === 'RENEWAL' ? 'Renovação' : 'Venda Nova');
        
        return `
            <div class="card" style="border-left: 4px solid var(--${colorClass}, #48bb78); margin-bottom: 15px;">
                <div class="card-header">
                    <div>
                        <div class="card-title">${icon} ${label}</div>
                        <div class="card-subtitle">${sale.product}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: var(--${colorClass}, #48bb78);">
                            R$ ${sale.price.toFixed(2)}
                        </div>
                    </div>
                </div>
                <p><strong>Cliente:</strong> ${sale.buyer.name}</p>
                <p><strong>Email:</strong> ${sale.buyer.email}</p>
                <p><strong>Data:</strong> ${formattedDate} às ${formattedTime}</p>
                ${sale.is_subscription ? `<p><strong>Parcela:</strong> ${sale.recurrency_number}ª</p>` : ''}
                <span class="badge badge-${colorClass}">
                    ✅ ${sale.status || 'APROVADO'}
                </span>
            </div>
        `;
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    showNotification(message, type = 'success') {
        console.log(`${type === 'success' ? '✅' : '⚠️'} ${message}`);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.hotmartSystem = new HotmartIntegration();
    hotmartSystem.init();
});