// Sistema Completo de Procedimentos
class ProcedimentosSystem {
  constructor() {
    this.procedimentos = [];
    this.editingId = null;
    this.db = null;
    this.isConnected = false;
  }

  init(firebaseDb = null) {
    this.db = firebaseDb;
    this.isConnected = !!firebaseDb;
    
    // Carrega dados salvos localmente se não tiver Firebase
    if (!this.isConnected) {
      this.loadFromLocalStorage();
    } else {
      this.loadFromFirebase();
    }
    
    this.bindEvents();
    this.setDefaultDate();
  }

  bindEvents() {
    // Botão adicionar
    const btnAdd = document.getElementById('btnProcAdd');
    if (btnAdd) {
      btnAdd.addEventListener('click', (e) => {
        e.preventDefault();
        this.addOrUpdateProcedimento();
      });
    }

    // Botão limpar
    const btnClear = document.getElementById('btnProcClear');
    if (btnClear) {
      btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearForm();
      });
    }

    // Delegação de eventos para a tabela
    const tbody = document.getElementById('procedTableBody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const tr = btn.closest('tr');
        const id = tr?.dataset.id;
        
        if (btn.classList.contains('btn-edit')) {
          this.editProcedimento(id);
        } else if (btn.classList.contains('btn-delete')) {
          this.deleteProcedimento(id);
        } else if (btn.classList.contains('btn-duplicate')) {
          this.duplicateProcedimento(id);
        }
      });
    }

    // Filtro de busca
    const searchInput = document.getElementById('procSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProcedimentos(e.target.value);
      });
    }

    // Filtro por status
    const statusFilter = document.getElementById('procStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterByStatus(e.target.value);
      });
    }
  }

  setDefaultDate() {
    const dateInput = document.getElementById('procData');
    if (dateInput && !dateInput.value) {
      dateInput.valueAsDate = new Date();
    }
  }

  clearForm() {
    document.getElementById('procData').valueAsDate = new Date();
    document.getElementById('procNumero').value = '';
    document.getElementById('procPlataforma').value = '';
    document.getElementById('procNomePromocao').value = '';
    document.getElementById('procCategoria').value = 'superodd';
    document.getElementById('procStatus').value = 'enviada_partida_em_aberto';
    document.getElementById('procRefFreebet').value = '';
    document.getElementById('procValorFreebet').value = '';
    document.getElementById('procValorFinal').value = '';
    
    // Reset editing state
    this.editingId = null;
    const btnAdd = document.getElementById('btnProcAdd');
    if (btnAdd) {
      btnAdd.innerHTML = '➕ Adicionar';
      btnAdd.classList.remove('btn-warning');
      btnAdd.classList.add('btn-primary');
    }
  }

  getFormData() {
    return {
      data: document.getElementById('procData').value,
      numero: parseInt(document.getElementById('procNumero').value) || 0,
      plataforma: document.getElementById('procPlataforma').value.trim(),
      promocao: document.getElementById('procNomePromocao').value.trim(),
      categoria: document.getElementById('procCategoria').value,
      status: document.getElementById('procStatus').value,
      refFreebet: document.getElementById('procRefFreebet').value.trim(),
      valorFreebet: parseFloat(document.getElementById('procValorFreebet').value) || 0,
      valorFinal: parseFloat(document.getElementById('procValorFinal').value) || 0
    };
  }

  validateForm(data) {
    if (!data.numero) {
      alert('Por favor, informe o número do procedimento');
      document.getElementById('procNumero').focus();
      return false;
    }
    
    if (!data.data) {
      alert('Por favor, informe a data');
      document.getElementById('procData').focus();
      return false;
    }
    
    return true;
  }

  async addOrUpdateProcedimento() {
    const data = this.getFormData();
    
    if (!this.validateForm(data)) return;

    if (this.editingId) {
      // Update existing
      await this.updateProcedimento(this.editingId, data);
    } else {
      // Add new
      await this.addProcedimento(data);
    }
    
    this.clearForm();
    // NÃO renderiza aqui se tiver Firebase - o snapshot vai fazer isso
    if (!this.isConnected) {
      this.render();
      this.updateStats();
    }
  }

  async addProcedimento(data) {
    const id = 'proc_' + Date.now();
    
    const procedimento = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('procedimentos').doc(id).set(procedimento);
        // NÃO adiciona localmente quando tem Firebase - o snapshot vai atualizar
        this.showToast('✅ Procedimento adicionado com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        // Se falhar, adiciona localmente
        this.procedimentos.unshift(procedimento);
        this.saveToLocalStorage();
        this.render();
      }
    } else {
      // Só adiciona localmente se não tiver Firebase
      this.procedimentos.unshift(procedimento);
      this.saveToLocalStorage();
      this.render();
      this.showToast('✅ Procedimento adicionado (modo local)!');
    }
  }

  async updateProcedimento(id, data) {
    const index = this.procedimentos.findIndex(p => p.id === id);
    
    if (index === -1) return;

    const updatedProc = {
      ...this.procedimentos[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('procedimentos').doc(id).update(updatedProc);
        // NÃO atualiza localmente - o snapshot vai fazer isso
        this.showToast('✅ Procedimento atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar no Firebase:', error);
        // Se falhar, atualiza localmente
        this.procedimentos[index] = updatedProc;
        this.saveToLocalStorage();
        this.render();
      }
    } else {
      // Só atualiza localmente se não tiver Firebase
      this.procedimentos[index] = updatedProc;
      this.saveToLocalStorage();
      this.render();
      this.showToast('✅ Procedimento atualizado (modo local)!');
    }
  }

  async deleteProcedimento(id) {
    if (!confirm('Tem certeza que deseja remover este procedimento?')) return;

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('procedimentos').doc(id).delete();
        // NÃO remove localmente - o snapshot vai fazer isso
        this.showToast('🗑️ Procedimento removido!');
      } catch (error) {
        console.error('Erro ao deletar no Firebase:', error);
        // Se falhar, remove localmente
        this.procedimentos = this.procedimentos.filter(p => p.id !== id);
        this.saveToLocalStorage();
        this.render();
        this.updateStats();
      }
    } else {
      // Só remove localmente se não tiver Firebase
      this.procedimentos = this.procedimentos.filter(p => p.id !== id);
      this.saveToLocalStorage();
      this.render();
      this.updateStats();
      this.showToast('🗑️ Procedimento removido (modo local)!');
    }
  }

  editProcedimento(id) {
    const proc = this.procedimentos.find(p => p.id === id);
    if (!proc) return;

    // Preenche o formulário
    document.getElementById('procData').value = proc.data;
    document.getElementById('procNumero').value = proc.numero;
    document.getElementById('procPlataforma').value = proc.plataforma;
    document.getElementById('procNomePromocao').value = proc.promocao;
    document.getElementById('procCategoria').value = proc.categoria;
    document.getElementById('procStatus').value = proc.status;
    document.getElementById('procRefFreebet').value = proc.refFreebet;
    document.getElementById('procValorFreebet').value = proc.valorFreebet;
    document.getElementById('procValorFinal').value = proc.valorFinal;

    // Muda o botão
    const btnAdd = document.getElementById('btnProcAdd');
    if (btnAdd) {
      btnAdd.innerHTML = '💾 Salvar Alterações';
      btnAdd.classList.remove('btn-primary');
      btnAdd.classList.add('btn-warning');
    }

    this.editingId = id;
    
    // Scroll para o formulário
    document.getElementById('procData').scrollIntoView({ behavior: 'smooth' });
  }

  duplicateProcedimento(id) {
    const proc = this.procedimentos.find(p => p.id === id);
    if (!proc) return;

    const newProc = {
      ...proc,
      id: 'proc_' + Date.now(),
      numero: proc.numero + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.procedimentos.unshift(newProc);
    this.saveToLocalStorage();
    this.render();
    this.updateStats();
    
    this.showToast('📋 Procedimento duplicado!');
  }

  getStatusBadge(status) {
    const statusMap = {
      'enviada_partida_em_aberto': { text: 'Partida em Aberto', class: 'badge-info' },
      'falta_girar_freebet': { text: 'Falta Girar Freebet', class: 'badge-warning' },
      'lucro_direto': { text: 'Lucro Direto', class: 'badge-success' },
      'finalizado': { text: 'Finalizado', class: 'badge-success' },
      'falta_enviar': { text: 'Falta Enviar', class: 'badge-warning' },
      'aposta_sem_risco': { text: 'Aposta sem Risco', class: 'badge-info' }
    };

    const config = statusMap[status] || { text: status, class: 'badge-secondary' };
    return `<span class="status-badge ${config.class}">${config.text}</span>`;
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

  render(procedimentosToRender = null) {
    const tbody = document.getElementById('procedTableBody');
    const emptyState = document.getElementById('procedEmpty');
    
    if (!tbody) return;

    const procs = procedimentosToRender || this.procedimentos;

    if (procs.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = procs.map(p => {
      // Formata categoria com badge colorido
      const categoriaBadge = p.categoria === 'superodd' 
        ? '<span class="status-badge badge-danger">Superodd</span>'
        : p.categoria === 'freebet'
        ? '<span class="status-badge badge-info">Freebet</span>'
        : '<span class="status-badge badge-warning">Promoção</span>';

      return `
        <tr data-id="${p.id}">
          <td>${this.formatDate(p.data)}</td>
          <td style="text-align:center;"><strong>#${p.numero || '-'}</strong></td>
          <td>${p.plataforma || '-'}</td>
          <td>${p.promocao || '-'}</td>
          <td>${categoriaBadge}</td>
          <td>${this.getStatusBadge(p.status)}</td>
          <td>${p.refFreebet || '-'}</td>
          <td style="text-align:right;"><strong>${this.formatCurrency(p.valorFreebet)}</strong></td>
          <td style="text-align:right;"><strong>${this.formatCurrency(p.valorFinal)}</strong></td>
          <td class="edit-controls" style="white-space:nowrap;">
            <button class="btn btn-secondary btn-edit" title="Editar" style="padding:0.4rem 0.6rem; font-size:0.85rem;">✏️</button>
            <button class="btn btn-info btn-duplicate" title="Duplicar" style="padding:0.4rem 0.6rem; font-size:0.85rem;">📋</button>
            <button class="btn btn-danger btn-delete" title="Remover" style="padding:0.4rem 0.6rem; font-size:0.85rem;">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateStats() {
    const total = this.procedimentos.length;
    const valorTotal = this.procedimentos.reduce((sum, p) => sum + (p.valorFinal || 0), 0);
    const finalizados = this.procedimentos.filter(p => p.status === 'finalizado').length;
    const pendentes = this.procedimentos.filter(p => ['falta_girar_freebet', 'falta_enviar'].includes(p.status)).length;

    // Atualiza cards de estatísticas se existirem
    const statsHtml = `
      <div class="stat-card">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total de Procedimentos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${finalizados}</div>
        <div class="stat-label">Finalizados</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${pendentes}</div>
        <div class="stat-label">Pendentes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${this.formatCurrency(valorTotal)}</div>
        <div class="stat-label">Valor Total</div>
      </div>
    `;

    const statsContainer = document.getElementById('procedStats');
    if (statsContainer) {
      statsContainer.innerHTML = statsHtml;
    }
  }

  filterProcedimentos(searchText) {
    const filtered = this.procedimentos.filter(p => {
      const search = searchText.toLowerCase();
      return (
        p.numero.toString().includes(search) ||
        (p.plataforma && p.plataforma.toLowerCase().includes(search)) ||
        (p.promocao && p.promocao.toLowerCase().includes(search)) ||
        (p.refFreebet && p.refFreebet.toLowerCase().includes(search))
      );
    });
    
    this.render(filtered);
  }

  filterByStatus(status) {
    if (!status || status === 'todos') {
      this.render();
      return;
    }
    
    const filtered = this.procedimentos.filter(p => p.status === status);
    this.render(filtered);
  }

  showToast(message) {
    // Remove toast anterior se existir
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

  // Local Storage
  saveToLocalStorage() {
    if (!this.isConnected) {
      localStorage.setItem('procedimentos', JSON.stringify(this.procedimentos));
    }
  }

  loadFromLocalStorage() {
    const saved = localStorage.getItem('procedimentos');
    if (saved) {
      this.procedimentos = JSON.parse(saved);
      this.render();
      this.updateStats();
    }
  }

  // Firebase
  async loadFromFirebase() {
    if (!this.db) return;
    
    try {
      const snapshot = await this.db.collection('procedimentos')
        .orderBy('data', 'desc')
        .limit(100)
        .get();
      
      this.procedimentos = [];
      snapshot.forEach(doc => {
        this.procedimentos.push({
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

  // Export data
  exportToCSV() {
    const headers = ['Data', 'Número', 'Plataforma', 'Promoção', 'Categoria', 'Status', 'Ref Freebet', 'Valor Freebet', 'Valor Final'];
    const rows = this.procedimentos.map(p => [
      p.data,
      p.numero,
      p.plataforma,
      p.promocao,
      p.categoria,
      p.status,
      p.refFreebet,
      p.valorFreebet,
      p.valorFinal
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procedimentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    this.showToast('📥 Dados exportados!');
  }
}

// Adiciona animações CSS se não existirem
if (!document.querySelector('#procedimentos-animations')) {
  const style = document.createElement('style');
  style.id = 'procedimentos-animations';
  style.innerHTML = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .btn-info {
      background: linear-gradient(135deg, var(--info), #0891b2);
      color: white;
      border: none;
    }
    .btn-warning {
      background: linear-gradient(135deg, var(--warning), #d97706);
      color: white;
      border: none;
    }
    /* Ajuste para botões na tabela */
    .edit-controls {
      display: flex;
      gap: 0.3rem;
      justify-content: flex-start;
    }
    .edit-controls .btn {
      min-width: auto;
      white-space: nowrap;
    }
    /* Melhora alinhamento da tabela */
    #procedTableBody td {
      vertical-align: middle;
    }
    /* Badges na tabela */
    .status-badge {
      display: inline-block;
      min-width: auto;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

// Export to window
window.ProcedimentosSystem = ProcedimentosSystem;