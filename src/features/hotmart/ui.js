// src/features/hotmart/ui.js
// UI mínima para a Aba Controle Hotmart: cria containers, esconde credenciais,
// e expõe renderTabelaVendas / renderTabelaAssinaturas para o controle.js usar.

(function () {
  // ==== Utils ====
  const $ = (s, r = document) => { try { return r.querySelector(s); } catch { return null; } };
  const $$ = (s, r = document) => { try { return Array.from(r.querySelectorAll(s)); } catch { return []; } };
  const fmtBRL = (n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : n;
  };
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts));
    return isNaN(d) ? '' : d.toLocaleString('pt-BR');
  };
  function clear(el) { if (!el) return; while (el.firstChild) el.removeChild(el.firstChild); }

  // ==== Esconder bloco de credenciais (fluxo antigo) ====
  function hideLegacyCreds() {
    const candidates = [
      '[data-hotmart-credentials]',
      '#hotmart-credentials',
      '.hotmart-credentials',
      // tentativas por heurística (labels/inputs conhecidos):
      'input[name="hotmart_client_id"]',
      '#hotmartClientSecret',
      '#hotmartBasicToken',
      '#loginAsPassword', '#createPassword'
    ];
    for (const sel of candidates) {
      $$(sel).forEach((node) => {
        const box = node.closest('form, .card, .box, .container, section, fieldset, .row, .col') || node;
        box.style.display = 'none';
      });
    }
    const status = $('[data-hotmart-status], #hotmart-status');
    if (status) status.textContent = 'Conectado via servidor (OAuth2)';
  }

  // ==== Containers padrão da Aba ====
  function ensureContainers() {
    let wrap = $('#hotmart-wrap');
    if (!wrap) {
      wrap = document.createElement('section');
      wrap.id = 'hotmart-wrap';
      wrap.style.marginTop = '16px';
      document.body.appendChild(wrap);
    }

    // Contadores
    let counters = $('#hotmart-counters', wrap);
    if (!counters) {
      counters = document.createElement('div');
      counters.id = 'hotmart-counters';
      counters.innerHTML = `
        <div class="hotmart-counters">
          <span id="hm-sales-count">Vendas: 0</span>
          <span id="hm-subs-count" style="margin-left:12px">Assinaturas: 0</span>
          <span id="hm-status" style="margin-left:12px;opacity:.8"></span>
        </div>
      `;
      wrap.appendChild(counters);
    }

    // Tabela de vendas
    let sales = $('#hotmart-sales', wrap);
    if (!sales) {
      sales = document.createElement('div');
      sales.id = 'hotmart-sales';
      sales.innerHTML = `
        <h3 style="margin:12px 0 8px">Vendas</h3>
        <div class="table-scroll">
          <table id="hotmart-sales-table" class="hotmart-table">
            <thead>
              <tr>
                <th>Data Aprovação</th>
                <th>Status</th>
                <th>Buyer</th>
                <th>Produto</th>
                <th>Email</th>
                <th>Código</th>
                <th>Valor</th>
                <th>Moeda</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;
      wrap.appendChild(sales);
    }

    // Tabela de assinaturas
    let subs = $('#hotmart-subs', wrap);
    if (!subs) {
      subs = document.createElement('div');
      subs.id = 'hotmart-subs';
      subs.innerHTML = `
        <h3 style="margin:20px 0 8px">Assinaturas</h3>
        <div class="table-scroll">
          <table id="hotmart-subs-table" class="hotmart-table">
            <thead>
              <tr>
                <th>Assinante</th>
                <th>Email</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Início</th>
                <th>Última Cobrança</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;
      wrap.appendChild(subs);
    }
  }

  // ==== Render Vendas ====
  function renderTabelaVendas(items = []) {
    hideLegacyCreds();
    ensureContainers();
    const elCount = $('#hm-sales-count'); if (elCount) elCount.textContent = `Vendas: ${items.length}`;
    const tbody = $('#hotmart-sales-table tbody');
    if (!tbody) return;
    clear(tbody);

    for (const it of items) {
      // Estrutura típica (Sales History): purchase, buyer, product, currency, price, status, approved_date
      const buyerName = it?.buyer?.name || it?.buyer?.( 'name') || it?.buyer?.buyer_name || '';
      const email = it?.buyer?.email || '';
      const product = it?.product?.name || '';
      const code = it?.purchase?.code || it?.code || '';
      const status = it?.status || it?.purchase?.status || '';
      const currency = (it?.currency?.code || it?.currency || '').toString().toUpperCase();
      const amount = it?.price ?? it?.hotmart_fee ?? it?.purchase?.price ?? it?.value ?? '';
      const approved = it?.approved_date || it?.purchase?.approved_date || it?.purchase?.approvedDate || '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtDate(approved)}</td>
        <td>${status}</td>
        <td>${buyerName}</td>
        <td>${product}</td>
        <td>${email}</td>
        <td>${code}</td>
        <td>${fmtBRL(amount)}</td>
        <td>${currency}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ==== Render Assinaturas ====
  function renderTabelaAssinaturas(items = []) {
    ensureContainers();
    const elCount = $('#hm-subs-count'); if (elCount) elCount.textContent = `Assinaturas: ${items.length}`;
    const tbody = $('#hotmart-subs-table tbody');
    if (!tbody) return;
    clear(tbody);

    for (const it of items) {
      // Campos comuns em get-subscribers: subscriber, email, status, plan, start_date, last_charge_date
      const name = it?.subscriber?.name || it?.buyer?.name || '';
      const email = it?.subscriber?.email || it?.email || '';
      const status = it?.status || '';
      const plan = it?.plan?.name || it?.plan_name || '';
      const start = it?.start_date || it?.startDate || '';
      const last = it?.last_charge_date || it?.lastChargeDate || '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${name}</td>
        <td>${email}</td>
        <td>${status}</td>
        <td>${plan}</td>
        <td>${fmtDate(start)}</td>
        <td>${fmtDate(last)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // expõe global para o controle.js atual
  window.renderTabelaVendas = renderTabelaVendas;
  window.renderTabelaAssinaturas = renderTabelaAssinaturas;
})();
