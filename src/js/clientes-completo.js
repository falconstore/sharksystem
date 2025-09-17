// Sistema Completo de Controle de Clientes
class ClientesSystem {
  constructor() {
    this.clientes = [];
    this.editingId = null;
    this.db = null;
    this.isConnected = false;
  }

  init(firebaseDb = null) {
    this.db = firebaseDb;
    this.isConnected = !!firebaseDb;
    
    if (!this.isConnected) {
      this.loadFromLocalStorage();
    }
    
    this.bindEvents();
    this.setDefaultDate();
  }

  bindEvents() {
    // Form submit
    const form = document.getElementById('clienteForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addOrUpdateCliente();
      });
    }

    // Botão limpar
    const btnClear = document.getElementById('btnClienteClear');
    if (btnClear) {
      btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearForm();
      });
    }

    // Delegação de eventos para a tabela
    const tbody = document.getElementById('clientesTableBody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const tr = btn.closest('tr');
        const id = tr?.dataset.id;
        
        if (btn.classList.contains('btn-edit')) {
          this.editCliente(id);
        } else if (btn.classList.contains('btn-delete')) {
          this.deleteCliente(id);
        } else if (btn.classList.contains('btn-whatsapp')) {
          this.sendWhatsApp(id);
        }
      });
    }

    // Filtros
    ['buscarNome', 'filtroStatus', 'filtroGrupo', 'filtroDuracao'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.aplicarFiltros());
        el.addEventListener('change', () => this.aplicarFiltros());
      }
    });
  }

  setDefaultDate() {
    const dateInput = document.getElementById('dataVenda');
    if (dateInput && !dateInput.value) {
      dateInput.valueAsDate = new Date();
    }
  }

  clearForm() {
    const form = document.getElementById('clienteForm');
    if (form) form.reset();
    this.setDefaultDate();
    
    this.editingId = null;
    const btnAdd = document.getElementById('btnClienteAdd');
    if (btnAdd) {
      btnAdd.innerHTML = '➕ Adicionar Cliente';
      btnAdd.classList.remove('btn-warning');
      btnAdd.classList.add('btn-primary');
    }
  }

  getFormData() {
    return {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      telegram: document.getElementById('telegram').value.trim(),
      dataVenda: document.getElementById('dataVenda').value,
      duracao: parseInt(document.getElementById('duracao').value),
      valorPago: parseFloat(document.getElementById('valorPago').value) || 0,
      metodoPagamento: document.getElementById('metodoPagamento').value,
      statusGrupo: document.getElementById('statusGrupo').value || 'no_grupo',
      observacoes: document.getElementById('observacoes').value.trim()
    };
  }

  validateForm(data) {
    if (!data.nome) {
      alert('Por favor, informe o nome do cliente');
      document.getElementById('nome').focus();
      return false;
    }
    
    if (!data.dataVenda) {
      alert('Por favor, informe a data da venda');
      document.getElementById('dataVenda').focus();
      return false;
    }
    
    if (!data.valorPago || data.valorPago <= 0) {
      alert('Por favor, informe o valor pago');
      document.getElementById('valorPago').focus();
      return false;
    }
    
    return true;
  }

  async addOrUpdateCliente() {
    const data = this.getFormData();
    
    if (!this.validateForm(data)) return;

    if (this.editingId) {
      await this.updateCliente(this.editingId, data);
    } else {
      await this.addCliente(data);
    }
    
    this.clearForm();
    if (!this.isConnected) {
      this.render();
      this.updateStats();
    }
  }

  async addCliente(data) {
    const id = 'cliente_' + Date.now();
    
    const cliente = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('clientes').doc(id).set(cliente);
        this.showToast('✅ Cliente adicionado com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        this.clientes.unshift(cliente);
        this.saveToLocalStorage();
        this.render();
      }
    } else {
      this.clientes.unshift(cliente);
      this.saveToLocalStorage();
      this.render();
      this.showToast('✅ Cliente adicionado (modo local)!');
    }
  }

  async updateCliente(id, data) {
    const index = this.clientes.findIndex(c => c.id === id);
    
    if (index === -1) return;

    const updatedCliente = {
      ...this.clientes[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('clientes').doc(id).update(updatedCliente);
        this.showToast('✅ Cliente atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar no Firebase:', error);
        this.clientes[index] = updatedCliente;
        this.saveToLocalStorage();
        this.render();
      }
    } else {
      this.clientes[index] = updatedCliente;
      this.saveToLocalStorage();
      this.render();
      this.showToast('✅ Cliente atualizado (modo local)!');
    }
  }

  async deleteCliente(id) {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('clientes').doc(id).delete();
        this.showToast('🗑️ Cliente removido!');
      } catch (error) {
        console.error('Erro ao deletar no Firebase:', error);
        this.clientes = this.clientes.filter(c => c.id !== id);
        this.saveToLocalStorage();
        this.render();
        this.updateStats();
      }
    } else {
      this.clientes = this.clientes.filter(c => c.id !== id);
      this.saveToLocalStorage();
      this.render();
      this.updateStats();
      this.showToast('🗑️ Cliente removido (modo local)!');
    }
  }

  editCliente(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    // Preenche o formulário
    document.getElementById('nome').value = cliente.nome;
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telegram').value = cliente.telegram || '';
    document.getElementById('dataVenda').value = cliente.dataVenda;
    document.getElementById('duracao').value = cliente.duracao;
    document.getElementById('valorPago').value = cliente.valorPago;
    document.getElementById('metodoPagamento').value = cliente.metodoPagamento || '';
    document.getElementById('statusGrupo').value = cliente.statusGrupo || 'no_grupo';
    document.getElementById('observacoes').value = cliente.observacoes || '';

    // Muda o botão
    const btnAdd = document.getElementById('btnClienteAdd');
    if (btnAdd) {
      btnAdd.innerHTML = '💾 Salvar Alterações';
      btnAdd.classList.remove('btn-primary');
      btnAdd.classList.add('btn-warning');
    }

    this.editingId = id;
    
    // Scroll para o formulário
    document.getElementById('nome').scrollIntoView({ behavior: 'smooth' });
  }

  // Helpers
  calcularDiasRestantes(dataVenda, duracao) {
    const hoje = new Date();
    const venda = new Date(dataVenda);
    const vencimento = new Date(venda);
    vencimento.setDate(venda.getDate() + duracao);
    return Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
  }

  isTerminalStatus(statusGrupo) {
    return ['removido', 'virou_mensal', 'virou_trimestral'].includes(statusGrupo);
  }

  getStatusBadge(cliente) {
    if (this.isTerminalStatus(cliente.statusGrupo)) {
      const badges = {
        'removido': { texto: 'Removido', classe: 'badge-danger' },
        'virou_mensal': { texto: 'Virou Mensal', classe: 'badge-info' },
        'virou_trimestral': { texto: 'Virou Trimestral', classe: 'badge-info' }
      };
      return badges[cliente.statusGrupo];
    }
    
    const dias = this.calcularDiasRestantes(cliente.dataVenda, cliente.duracao);
    
    if (dias < 0) {
      return {
        texto: `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`,
        classe: 'badge-danger'
      };
    } else if (dias === 0) {
      return { texto: 'Vence hoje', classe: 'badge-warning' };
    } else if (dias <= 3) {
      return {
        texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
        classe: 'badge-warning'
      };
    } else {
      return {
        texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
        classe: 'badge-success'
      };
    }
  }

  formatTelegramLink(telegram) {
    if (!telegram) return '';
    if (telegram.startsWith('http')) return telegram;
    if (telegram.startsWith('@')) return `https://t.me/${telegram.slice(1)}`;
    return `https://t.me/${telegram}`;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  sendWhatsApp(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;
    
    const status = this.getStatusBadge(cliente);
    const mensagem = `Olá ${cliente.nome}! Seu plano ${status.texto}. Entre em contato para renovar.`;
    const url = `https://wa.me/55${cliente.telegram}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }

  // Render
  render(clientesToRender = null) {
    const tbody = document.getElementById('clientesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;

    const clientes = clientesToRender || this.clientes;

    if (clientes.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Ordenar clientes
    const sorted = [...clientes].sort((a, b) => {
      const ta = this.isTerminalStatus(a.statusGrupo);
      const tb = this.isTerminalStatus(b.statusGrupo);
      if (ta !== tb) return ta - tb;
      
      const da = this.calcularDiasRestantes(a.dataVenda, a.duracao);
      const db = this.calcularDiasRestantes(b.dataVenda, b.duracao);
      return da - db;
    });

    tbody.innerHTML = sorted.map(c => {
      const status = this.getStatusBadge(c);
      const telegramUrl = this.formatTelegramLink(c.telegram);
      const dias = this.calcularDiasRestantes(c.dataVenda, c.duracao);
      
      // Badge do grupo
      const grupoBadge = c.statusGrupo === 'removido' 
        ? '<span class="status-badge badge-danger">Removido</span>'
        : c.statusGrupo === 'virou_mensal'
        ? '<span class="status-badge badge-info">Virou Mensal</span>'
        : c.statusGrupo === 'virou_trimestral'
        ? '<span class="status-badge badge-info">Virou Trimestral</span>'
        : '<span class="status-badge badge-success">No grupo</span>';

      return `
        <tr data-id="${c.id}" data-days-left="${dias}" data-grupo="${c.statusGrupo}">
          <td>
            <div><strong>${c.nome}</strong></div>
            ${c.email ? `<small style="color:var(--text-muted)">${c.email}</small>` : ''}
          </td>
          <td style="text-align:right;"><strong>${this.formatCurrency(c.valorPago)}</strong></td>
          <td>
            ${c.telegram ? 
              `<a href="${telegramUrl}" target="_blank" class="btn-link" title="${c.telegram}">🔗 Telegram</a>` : 
              '<span style="color:var(--text-muted)">-</span>'
            }
          </td>
          <td>${this.formatDate(c.dataVenda)}</td>
          <td style="text-align:center;">${c.duracao} dias</td>
          <td><span class="status-badge ${status.classe}">${status.texto}</span></td>
          <td>${grupoBadge}</td>
          <td style="text-align:center;">
            <span style="text-transform:capitalize">${c.metodoPagamento || '-'}</span>
          </td>
          <td class="edit-controls" style="white-space:nowrap;">
            <button class="btn btn-secondary btn-edit" title="Editar" style="padding:0.4rem 0.6rem;">✏️</button>
            ${c.telegram ? 
              `<button class="btn btn-success btn-whatsapp" title="WhatsApp" style="padding:0.4rem 0.6rem;">📱</button>` : 
              ''
            }
            <button class="btn btn-danger btn-delete" title="Remover" style="padding:0.4rem 0.6rem;">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateStats() {
    const total = this.clientes.length;
    let ativos = 0, vencendo = 0, vencidos = 0;
    let receitaTotal = 0, receitaMensal = 0;
    
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    this.clientes.forEach(c => {
      const valor = c.valorPago || 0;
      receitaTotal += valor;
      
      if (new Date(c.dataVenda) >= inicioMes) {
        receitaMensal += valor;
      }
      
      if (this.isTerminalStatus(c.statusGrupo)) {
        return;
      }
      
      const dias = this.calcularDiasRestantes(c.dataVenda, c.duracao);
      if (dias < 0) vencidos++;
      else if (dias <= 3) vencendo++;
      else ativos++;
    });

    // Atualiza os elementos
    document.getElementById('totalClientes').textContent = total;
    document.getElementById('clientesAtivos').textContent = ativos;
    document.getElementById('clientesVencendo').textContent = vencendo;
    document.getElementById('clientesVencidos').textContent = vencidos;
    document.getElementById('receitaTotal').textContent = this.formatCurrency(receitaTotal);
    document.getElementById('receitaMensal').textContent = this.formatCurrency(receitaMensal);
  }

  aplicarFiltros() {
    const busca = (document.getElementById('buscarNome')?.value || '').toLowerCase();
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    const filtroGrupo = document.getElementById('filtroGrupo')?.value || '';
    const filtroDuracao = document.getElementById('filtroDuracao')?.value || '';
    
    let filtrados = [...this.clientes];
    
    if (busca) {
      filtrados = filtrados.filter(c => 
        c.nome.toLowerCase().includes(busca) ||
        (c.email && c.email.toLowerCase().includes(busca)) ||
        (c.telegram && c.telegram.toLowerCase().includes(busca))
      );
    }
    
    if (filtroStatus) {
      filtrados = filtrados.filter(c => {
        if (this.isTerminalStatus(c.statusGrupo)) return false;
        
        const dias = this.calcularDiasRestantes(c.dataVenda, c.duracao);
        if (filtroStatus === 'ativo') return dias > 3;
        if (filtroStatus === 'vencendo') return dias >= 0 && dias <= 3;
        if (filtroStatus === 'vencido') return dias < 0;
        return true;
      });
    }
    
    if (filtroGrupo) {
      filtrados = filtrados.filter(c => c.statusGrupo === filtroGrupo);
    }
    
    if (filtroDuracao) {
      filtrados = filtrados.filter(c => c.duracao === parseInt(filtroDuracao));
    }
    
    this.render(filtrados);
    
    // Atualiza contador
    document.getElementById('countFiltradosClientes').textContent = filtrados.length;
  }

  limparFiltros() {
    document.getElementById('buscarNome').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroGrupo').value = '';
    document.getElementById('filtroDuracao').value = '';
    this.aplicarFiltros();
  }

  showToast(message) {
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  saveToLocalStorage() {
    if (!this.isConnected) {
      localStorage.setItem('clientes', JSON.stringify(this.clientes));
    }
  }

  loadFromLocalStorage() {
    const saved = localStorage.getItem('clientes');
    if (saved) {
      this.clientes = JSON.parse(saved);
      this.render();
      this.updateStats();
    }
  }

  async loadFromFirebase() {
    if (!this.db) return;
    
    try {
      const snapshot = await this.db.collection('clientes')
        .orderBy('dataVenda', 'desc')
        .limit(200)
        .get();
      
      this.clientes = [];
      snapshot.forEach(doc => {
        this.clientes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      this.render();
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar do Firebase:', error);
      this.loadFromLocalStorage();
    }
  }
}

// Export to window
window.ClientesSystem = ClientesSystem;