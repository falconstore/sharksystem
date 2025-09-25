// src/features/hotmart/bridge.js
// Ponte do FRONT para /api/hotmart/* (token e paginação geridos no servidor)

(function () {
  const SELECTORS = {
    credBlock: '[data-hotmart-credentials], #hotmart-credentials, .hotmart-credentials',
    clientId:  'input[name="hotmart_client_id"], #hotmart_client_id',
    clientSec: 'input[name="hotmart_client_secret"], #hotmart_client_secret',
    statusEl:  '[data-hotmart-status], #hotmart-status',
    btnConnect:'[data-hotmart-connect], #hotmart-connect',
  };

  function $(sel, root = document) {
    try { return root.querySelector(sel); } catch { return null; }
  }
  function hide(node) { if (node) node.style.display = 'none'; }
  function disable(node) { if (node) { node.disabled = true; node.setAttribute('aria-disabled','true'); } }
  function setStatus(msg) { const el = $(SELECTORS.statusEl); if (el) el.textContent = msg; }

  async function apiGet(path, params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || Number.isNaN(v)) return;
      qs.set(k, String(v));
    });
    const url = qs.toString() ? `${path}?${qs}` : path;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erro ao chamar ${path}`);
    return data; // { items, count }
  }

  async function listSales(params = {}) {
    return apiGet('/api/hotmart/sales', params);
  }
  async function listSubscriptions(params = {}) {
    return apiGet('/api/hotmart/subscriptions', params);
  }

  function initCredentiallessUI() {
    hide($(SELECTORS.credBlock));
    disable($(SELECTORS.clientId));
    disable($(SELECTORS.clientSec));
    hide($(SELECTORS.btnConnect));
    setStatus('Conectado via servidor (OAuth2)');
  }

  // Expor API p/ código existente
  window.HotmartBridge = {
    init: initCredentiallessUI,
    listSales,
    listSubscriptions,
  };
})();
