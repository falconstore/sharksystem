// src/features/hotmart/bridge.js
(function () {
  const $ = (s, r = document) => { try { return r.querySelector(s); } catch { return null; } };

  function setStatus(msg) {
    const el = $('[data-hotmart-status], #hotmart-status') || $('#hm-status');
    if (el) el.textContent = msg;
  }

  async function parseResponse(res, url) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    const text = await res.text();
    throw new Error(`Resposta não-JSON em ${url}: ${text.slice(0,200)}`);
  }

  async function apiGet(path, params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || Number.isNaN(v)) return;
      qs.set(k, String(v));
    });
    const url = qs.toString() ? `${path}?${qs}` : path;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await parseResponse(res, url);
    if (!res.ok) throw new Error(data?.error || `Erro em ${path}`);
    return data;
  }

  async function listSales(params = {}) { return apiGet('/api/hotmart/sales', params); }
  async function listSubscriptions(params = {}) { return apiGet('/api/hotmart/subscriptions', params); }

  function initCredentiallessUI() {
    // esconder bloco de credenciais (se existir)
    const hideCandidates = [
      '[data-hotmart-credentials]','#hotmart-credentials','.hotmart-credentials',
      'input[name="hotmart_client_id"]', '#hotmartClientSecret', '#hotmartBasicToken'
    ];
    hideCandidates.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => {
        const box = node.closest('form, .card, .box, .container, section, fieldset, .row, .col') || node;
        box.style.display = 'none';
      });
    });
    setStatus('Conectado via servidor (OAuth2)');
  }

  window.HotmartBridge = { init: initCredentiallessUI, listSales, listSubscriptions };

  // Evita "connectHotmart is not defined" do HTML legado
  window.connectHotmart = function () {
    console.warn('Fluxo legado: connectHotmart() — agora a conexão é automática via server.');
    setStatus('Conectado via servidor (OAuth2)');
    return false;
  };
})();
