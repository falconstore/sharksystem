// Clientes Management
class ClientesManager {
  constructor() {
    this.clientes = [];
    this.db = null;
    this.isConnected = false;
  }

  init(db, isConnected) {
    this.db = db;
    this.isConnected = isConnected;
    
    this.bindForm();
    this.setDefaultDate();
    
    // Event delegation for table actions
    document.getElementById('clientesTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const row = btn.closest('tr');
      const id = row?.dataset.id;
      const action = btn.dataset.action;
      
      if (action === 'edit') this.toggleEditRow(id, true);
      else if (action === 'save') this.saveRow(id);
      else if (action === 'cancel') this.toggleEditRow(id, false, true);
      else if (action === 'remove') this.removerCliente(id);
    });
  }

  bindForm() {
    const form = document.getElementById('clienteForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.adicionarCliente();
      });
    }
  }

  setDefaultDate() {
    const el = document.getElementById('dataVenda');
    if (el) {
      el.value = new Date().toISOString().split('T')[0];
    }
  }

  setupRealtime() {
    if (!this.db || !this.isConnected) return;
    
    this.db.collection('clientes').onSnapshot((snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      this.clientes = arr;
      this.renderClientes();
      this.updateStats();
    });
  }

  async loadFromFirebase() {
    if (!this.db || !this.isConnected) return;
    
    const snap = await this.db.collection('clientes').get();
    this.clientes = [];
    snap.forEach(d => this.clientes.push({ id: d.id, ...d.data() }));
    this.renderClientes();
    this.updateStats();
  }

  // Helper functions
  isTerminalStatusGrupo(statusGrupo) {
    return ['removido', 'virou_mensal', 'virou_trimestral'].includes(statusGrupo);
  }

  calcularDiasRestantes(dataVenda, duracao) {
    const hoje = new Date();
    const venda = new Date(dataVenda);
    const vencimento = new Date(venda);
    vencimento.setDate(venda.getDate() + duracao);
    return Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
  }

  getStatusBadge(cliente) {
    if (this.isTerminalStatusGrupo(cliente.statusGrupo)) {
      if (cliente.statusGrupo === 'removido') {
        return { texto: 'Removido', classe: 'badge-danger' };
      }
      if (cliente.statusGrupo === 'virou_mensal') {
        return { texto: 'Virou Mensal', classe: 'badge-info' };
      }
      if (cliente.statusGrupo === 'virou_trimestral') {
        return { texto: 'Virou Trimestral', classe: 'badge-info' };
      }
    }
    
    const dias = this.calcularDiasRestantes(cliente.dataVenda, cliente.duracao);
    if (dias < 0) {
      return {
        texto: `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`,
        classe: 'badge-danger'
      };
    }
    if (dias === 0) {
      return { texto: 'Vence hoje', classe: 'badge-warning' };
    }
    if (dias <= 3) {
      return {
        texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
        classe: 'badge-warning'
      };
    }
    return {
      texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
      classe: 'badge-success'
    };
  }

  formatTelegramLink(telegram) {
    if (!telegram) return '';
    if (telegram.startsWith('http')) return telegram;
    if (telegram.startsWith('@')) return `https://t.me/${telegram.slice(1)}`;
    return `https://t.me/${telegram}`;
  }

  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // CRUD Operations
  async adicionarCliente() {
    const nome = document.getElementById('nome')?.value.trim();
    const telegram = document.getElementById('telegram')?.value.trim();
    const dataVenda = document.getElementById('dataVenda')?.value;
    const duracao = parseInt(document.getElementById('duracao')?.value);
    const valorPago = parseFloat(document.getElementById('valorPago')?.value);
    const metodoPagamento = document.getElementById('metodoPagamento')?.value;
    const email = document.getElementById('email')?.value.trim();
    const observacoes = document.getElementById('observacoes')?.value.trim();
    const statusGrupo = document.getElementById('statusGrupo')?.value || 'no_grupo';

    if (!nome || !dataVenda || isNaN(valorPago)) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const addIcon = document.getElementById('addIcon');
    if (addIcon) addIcon.textContent = '⏳';

    try {
      const payload = {
        nome,
        telegram,
        dataVenda,
        duracao,
        valorPago,
        metodoPagamento,
        email,
        observacoes,
        statusGrupo,
        createdAt: this.isConnected ? firebase.firestore.FieldValue.serverTimestamp() : null,
        updatedAt: this.isConnected ? firebase.firestore.FieldValue.serverTimestamp() : null
      };

      if (this.isConnected && this.db) {
        await this.db.collection('clientes').add(payload);
      } else {
        payload.id = 'local-' + Date.now();
        this.clientes.push(payload);
        this.renderClientes();
        this.updateStats();
      }

      const form = document.getElementById('clienteForm');
      if (form) {
        form.reset();
        this.setDefaultDate();
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar.');
    } finally {
      if (addIcon) addIcon.textContent = '➕';
    }
  }

  async removerCliente(id) {
    if (!confirm('Remover este cliente?')) return;
    
    try {
      if (this.isConnected && this.db && !id.startsWith('local-')) {
        await this.db.collection('clientes').doc(id).delete();
      }
      this.clientes = this.clientes.filter(c => c.id !== id);
      this.renderClientes();
      this.updateStats();
    } catch (e) {
      console.error(e);
      alert('Erro ao remover.');
    }
  }

  async atualizarCliente(id, updates) {
    const i = this.clientes.findIndex(c => c.id === id);
    if (i > -1) {
      this.clientes[i] = { ...this.clientes[i], ...updates };
    }
    this.renderClientes();
    this.updateStats();
    
    if (this.isConnected && this.db && !id.startsWith('local-')) {
      await this.db.collection('clientes').doc(id).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  toggleEditRow(id, enable, cancel = false) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    
    const viewElements = row.querySelectorAll('.view-mode');
    const editElements = row.querySelectorAll('.edit-mode');
    const saveBtn = row.querySelector('[data-action="save"]');
    const cancelBtn = row.querySelector('[data-action="cancel"]');
    
    if (enable) {
      viewElements.forEach(e => e.style.display = 'none');
      editElements.forEach(e => e.style.display = 'block');
      if (saveBtn) saveBtn.style.display = '';
      if (cancelBtn) cancelBtn.style.display = '';
    } else {
      viewElements.forEach(e => e.style.display = '');
      editElements.forEach(e => e.style.display = 'none');
      if (saveBtn) saveBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (!cancel) this.renderClientes();
    }
  }

  async saveRow(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const nome = row.querySelector('[data-edit="nome"]').value.trim();
    const email = row.querySelector('[data-edit="email"]').value.trim();
    const valorPago = parseFloat(row.querySelector('[data-edit="valorPago"]').value);
    const telegram = row.querySelector('[data-edit="telegram"]').value.trim();
    const dataVenda = row.querySelector('[data-edit="dataVenda"]').value;
    const duracao = parseInt(row.querySelector('[data-edit="duracao"]').value);
    const statusGrupo = row.querySelector('[data-edit="statusGrupo"]').value;
    const metodoPagamento = row.querySelector('[data-edit="metodoPagamento"]').value;

    const updates = {
      nome,
      email,
      valorPago: isNaN(valorPago) ? 0 : valorPago,
      telegram,
      dataVenda,
      duracao,
      statusGrupo,
      metodoPagamento
    };
    
    await this.atualizarCliente(id, updates);
    this.toggleEditRow(id, false);
  }

  // Render table
  renderClientes() {
    const tbody = document.getElementById('clientesTableBody');
    const empty = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!this.clientes.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';

    const arr = [...this.clientes].sort((a, b) => {
      const ta = this.isTerminalStatusGrupo(a.statusGrupo);
      const tb = this.isTerminalStatusGrupo(b.statusGrupo);
      if (ta !== tb) return ta - tb;
      
      const da = this.calcularDiasRestantes(a.dataVenda, a.duracao);
      const db = this.calcularDiasRestantes(b.dataVenda, b.duracao);
      return da - db;
    });

    tbody.innerHTML = arr.map(c => {
      const st = this.getStatusBadge(c);
      const tgUrl = this.formatTelegramLink(c.telegram);
      const dias = this.calcularDiasRestantes(c.dataVenda, c.duracao);
      const dataGrupo = c.statusGrupo || 'no_grupo';

      return `
        <tr data-id="${c.id}" data-days-left="${dias}" data-grupo="${dataGrupo}">
          <td>
            <div class="view-mode">
              <strong>${c.nome || '-'}</strong>
              ${c.email ? `<br><small style="color:var(--text-muted)">${c.email}</small>` : ''}
            </div>
            <div class="edit-mode" style="display:none">
              <label class="sr-only" for="nome-${c.id}">Nome</label>
              <input id="nome-${c.id}" class="form-input" data-edit="nome" value="${c.nome || ''}" style="margin-bottom:.4rem"/>
              <label class="sr-only" for="email-${c.id}">E-mail</label>
              <input id="email-${c.id}" class="form-input" data-edit="email" value="${c.email || ''}" placeholder="email (opcional)"/>
            </div>
          </td>
          <td>
            <div class="view-mode"><strong>${this.formatCurrency(c.valorPago)}</strong></div>
            <div class="edit-mode" style="display:none">
              <input type="number" step="0.01" min="0" class="form-input" data-edit="valorPago" value="${(c.valorPago ?? 0).toFixed(2)}"/>
            </div>
          </td>
          <td>
            <div class="view-mode">
              ${c.telegram ? `<a href="${tgUrl}" target="_blank" class="btn-link" title="${c.telegram}">🔗 link</a>` : '<span style="color:var(--text-muted)">-</span>'}
            </div>
            <div class="edit-mode" style="display:none">
              <input class="form-input" data-edit="telegram" value="${c.telegram || ''}" placeholder="@usuario ou URL"/>
            </div>
          </td>
          <td>
            <div class="view-mode">${new Date(c.dataVenda).toLocaleDateString('pt-BR')}</div>
            <div class="edit-mode" style="display:none">
              <input type="date" class="form-input" data-edit="dataVenda" value="${c.dataVenda}"/>
            </div>
          </td>
          <td>
            <div class="view-mode">${c.duracao} dias</div>
            <div class="edit-mode" style="display:none">
              <select class="form-select" data-edit="duracao">
                <option value="7" ${c.duracao == 7 ? 'selected' : ''}>7 dias</option>
                <option value="30" ${c.duracao == 30 ? 'selected' : ''}>30 dias</option>
              </select>
            </div>
          </td>
          <td>
            <span class="status-badge ${st.classe}" title="${st.texto}">${st.texto}</span>