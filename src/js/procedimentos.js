// Procedimentos Management
class ProcedimentosManager {
  constructor() {
    this.procedimentos = [];
    this.unsubscribeProced = null;
    this.db = null;
    this.isConnected = false;
  }

  init(db, isConnected) {
    this.db = db;
    this.isConnected = isConnected;
    
    // Bind form buttons
    document.getElementById('btnProcAdd')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.addProcedimento();
    });
    
    document.getElementById('btnProcClear')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.clearProcForm();
    });
    
    // Event delegation for table actions
    document.getElementById('procedTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const row = btn.closest('tr');
      const id = row?.dataset.procId;
      if (!id) return;
      
      const action = btn.dataset.action;
      if (action === 'edit') this.toggleEditProcRow(id, true);
      else if (action === 'save') this.saveProcRow(id);
      else if (action === 'cancel') this.toggleEditProcRow(id, false, true);
      else if (action === 'remove') this.removeProcedimento(id);
    });
  }

  // Helper functions
  getMonthKey(dateStr) {
    const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  buildDocId(numero, dataStr) {
    const mes = this.getMonthKey(dataStr);
    const n = String(Number(numero || 0)).padStart(4, '0');
    return `procedimento_${n}_${mes}`;
  }

  clearProcForm() {
    document.getElementById('procData').value = '';
    document.getElementById('procNumero').value = '';
    document.getElementById('procPlataforma').value = '';
    document.getElementById('procNomePromocao').value = '';
    document.getElementById('procCategoria').value = 'superodd';
    document.getElementById('procStatus').value = 'enviada_partida_em_aberto';
    document.getElementById('procRefFreebet').value = '';
    document.getElementById('procValorFreebet').value = '';
    document.getElementById('procValorFinal').value = '';
  }

  // CREATE
  async addProcedimento() {
    const data = document.getElementById('procData').value || new Date().toISOString().slice(0, 10);
    const numero = parseInt(document.getElementById('procNumero').value || '0');
    const plataforma = document.getElementById('procPlataforma').value.trim();
    const promocao = document.getElementById('procNomePromocao').value.trim();
    const categoria = document.getElementById('procCategoria').value;
    const status = document.getElementById('procStatus').value || 'enviada_partida_em_aberto';
    const refFreebet = document.getElementById('procRefFreebet').value.trim();
    const valorFreebet = parseFloat(document.getElementById('procValorFreebet').value || '0');
    const valorFinal = parseFloat(document.getElementById('procValorFinal').value || '0');

    if (!numero) {
      alert('Informe o número do procedimento.');
      return;
    }

    const item = { data, numero, plataforma, promocao, categoria, status, refFreebet, valorFreebet, valorFinal };

    if (this.db && this.isConnected) {
      const id = this.buildDocId(numero, data);
      try {
        await this.db.collection('procedimentos').doc(id).set({
          ...item,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: false });
      } catch (e) {
        console.error(e);
        alert('Erro ao salvar procedimento.');
        return;
      }
    } else {
      this.procedimentos.push({ id: 'p-' + Date.now(), ...item });
      this.renderProcedimentos();
    }
    
    this.clearProcForm();
  }

  // DELETE
  async removeProcedimento(id) {
    if (!confirm('Remover este procedimento?')) return;

    if (this.db && this.isConnected && !id.startsWith('p-')) {
      try {
        await this.db.collection('procedimentos').doc(id).delete();
      } catch (e) {
        console.error(e);
        alert('Erro ao remover.');
      }
    } else {
      this.procedimentos = this.procedimentos.filter(p => p.id !== id);
      this.renderProcedimentos();
    }
  }

  // UPDATE
  async saveProcRow(id) {
    const row = document.querySelector(`tr[data-proc-id="${id}"]`);
    const data = row.querySelector('[data-edit="data"]').value;
    const numero = parseInt(row.querySelector('[data-edit="numero"]').value || '0');
    const plataforma = row.querySelector('[data-edit="plataforma"]').value.trim();
    const promocao = row.querySelector('[data-edit="promocao"]').value.trim();
    const categoria = row.querySelector('[data-edit="categoria"]').value;
    const status = row.querySelector('[data-edit="status"]').value;
    const refFreebet = row.querySelector('[data-edit="refFreebet"]').value.trim();
    const valorFreebet = parseFloat(row.querySelector('[data-edit="valorFreebet"]').value || '0');
    const valorFinal = parseFloat(row.querySelector('[data-edit="valorFinal"]').value || '0');

    const updates = { data, numero, plataforma, promocao, categoria, status, refFreebet, valorFreebet, valorFinal };

    if (this.db && this.isConnected && !id.startsWith('p-')) {
      const newId = this.buildDocId(numero, data);
      try {
        const oldRef = this.db.collection('procedimentos').doc(id);
        const oldSnap = await oldRef.get();
        const oldData = oldSnap.exists ? oldSnap.data() : {};
        const createdAt = oldData && oldData.createdAt ? oldData.createdAt : firebase.firestore.FieldValue.serverTimestamp();

        if (newId !== id) {
          await this.db.collection('procedimentos').doc(newId).set({
            ...oldData,
            ...updates,
            createdAt,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: false });
          await oldRef.delete();
        } else {
          await oldRef.set({
            ...oldData,
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch (e) {
        console.error(e);
        alert('Erro ao salvar atualização.');
        return;
      }
    } else {
      const i = this.procedimentos.findIndex(p => p.id === id);
      if (i > -1) {
        this.procedimentos[i] = { ...this.procedimentos[i], ...updates };
      }
      this.renderProcedimentos();
    }
    
    this.toggleEditProcRow(id, false);
  }

  // UI Helpers
  toggleEditProcRow(id, enable, cancel = false) {
    const row = document.querySelector(`tr[data-proc-id="${id}"]`);
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
      if (!cancel) this.renderProcedimentos();
    }
  }

  badgeForStatus(status) {
    const map = {
      enviada_partida_em_aberto: 'badge-info',
      falta_girar_freebet: 'badge-warning',
      lucro_direto: 'badge-success',
      finalizado: 'badge-success',
      falta_enviar: 'badge-warning',
      aposta_sem_risco: 'badge-info'
    };
    const cls = map[status] || 'badge-info';
    const texto = (status || '').replace(/_/g, ' ');
    return `<span class="status-badge ${cls}" title="${texto}">${texto || '-'}</span>`;
  }

  // Format currency
  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Render table
  renderProcedimentos() {
    const tbody = document.getElementById('procedTableBody');
    const empty = document.getElementById('procedEmpty');
    
    if (!tbody) return;

    if (!this.procedimentos.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';

    const arr = [...this.procedimentos].sort((a, b) => {
      const dateCompare = (a.data || '').localeCompare(b.data || '');
      if (dateCompare !== 0) return -dateCompare;
      return (b.numero || 0) - (a.numero || 0);
    });

    tbody.innerHTML = arr.map(p => `
      <tr data-proc-id="${p.id}">
        <td>
          <div class="view-mode">${p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}</div>
          <div class="edit-mode" style="display:none">
            <input type="date" class="form-input" data-edit="data" value="${p.data || ''}"/>
          </div>
        </td>
        <td>
          <div class="view-mode">${p.numero ?? '-'}</div>
          <div class="edit-mode" style="display:none">
            <input type="number" class="form-input" data-edit="numero" value="${p.numero ?? 0}" step="1" min="0"/>
          </div>
        </td>
        <td>
          <div class="view-mode">${p.plataforma || '-'}</div>
          <div class="edit-mode" style="display:none">
            <input class="form-input" data-edit="plataforma" value="${p.plataforma || ''}" placeholder="Plataforma"/>
          </div>
        </td>
        <td>
          <div class="view-mode">${p.promocao || '-'}</div>
          <div class="edit-mode" style="display:none">
            <input class="form-input" data-edit="promocao" value="${p.promocao || ''}" placeholder="Nome da Promoção"/>
          </div>
        </td>
        <td>
          <div class="view-mode" style="text-transform:capitalize">${p.categoria || '-'}</div>
          <div class="edit-mode" style="display:none">
            <select class="form-select" data-edit="categoria">
              <option value="superodd" ${p.categoria === 'superodd' ? 'selected' : ''}>Superodd</option>
              <option value="promocao" ${p.categoria === 'promocao' ? 'selected' : ''}>Promoção</option>
              <option value="freebet" ${p.categoria === 'freebet' ? 'selected' : ''}>Freebet</option>
            </select>
          </div>
        </td>
        <td>
          <div class="view-mode">${this.badgeForStatus(p.status)}</div>
          <div class="edit-mode" style="display:none">
            <select class="form-select" data-edit="status">
              <option value="enviada_partida_em_aberto" ${p.status === 'enviada_partida_em_aberto' ? 'selected' : ''}>Enviada Partida em Aberto</option>
              <option value="falta_girar_freebet" ${p.status === 'falta_girar_freebet' ? 'selected' : ''}>Falta Girar Freebet</option>
              <option value="lucro_direto" ${p.status === 'lucro_direto' ? 'selected' : ''}>Lucro Direto</option>
              <option value="finalizado" ${p.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
              <option value="falta_enviar" ${p.status === 'falta_enviar' ? 'selected' : ''}>Falta enviar</option>
              <option value="aposta_sem_risco" ${p.status === 'aposta_sem_risco' ? 'selected' : ''}>Aposta sem Risco</option>
            </select>
          </div>
        </td>
        <td>
          <div class="view-mode">${p.refFreebet || '-'}</div>
          <div class="edit-mode" style="display:none">
            <input class="form-input" data-edit="refFreebet" value="${p.refFreebet || ''}" placeholder="Referência"/>
          </div>
        </td>
        <td>
          <div class="view-mode"><strong>${this.formatCurrency(p.valorFreebet)}</strong></div>
          <div class="edit-mode" style="display:none">
            <input type="number" step="0.01" min="0" class="form-input" data-edit="valorFreebet" value="${(Number(p.valorFreebet || 0)).toFixed(2)}"/>
          </div>
        </td>
        <td>
          <div class="view-mode"><strong>${this.formatCurrency(p.valorFinal)}</strong></div>
          <div class="edit-mode" style="display:none">
            <input type="number" step="0.01" min="0" class="form-input" data-edit="valorFinal" value="${(Number(p.valorFinal || 0)).toFixed(2)}"/>
          </div>
        </td>
        <td class="edit-controls">
          <button class="btn btn-secondary" data-action="edit" aria-label="Editar procedimento">✏️ Editar</button>
          <button class="btn btn-primary" data-action="save" style="display:none" aria-label="Salvar">💾 Salvar</button>
          <button class="btn btn-secondary" data-action="cancel" style="display:none" aria-label="Cancelar edição">↩️ Cancelar</button>
          <button class="btn btn-danger" data-action="remove" aria-label="Remover procedimento">🗑️ Remover</button>
        </td>
      </tr>
    `).join('');
  }

  // Setup realtime updates
  setupRealtime() {
    if (!this.db || !this.isConnected) return;
    
    if (this.unsubscribeProced) {
      try {
        this.unsubscribeProced();
      } catch (e) {
        console.warn('Error unsubscribing:', e);
      }
      this.unsubscribeProced = null;
    }

    this.unsubscribeProced = this.db.collection('procedimentos')
      .orderBy('data', 'desc')
      .onSnapshot((snap) => {
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        this.procedimentos = arr;
        this.renderProcedimentos();
      }, (err) => {
        console.warn('Snapshot procedimentos:', err);
      });
  }
}

// Export to window
window.ProcedimentosManager = ProcedimentosManager;