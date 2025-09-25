// src/features/hotmart/controle.js
(function () {
  const $ = (s) => document.querySelector(s);
  const val = (s) => { const el = $(s); return el ? el.value : ''; };
  const parseDateOrUndef = (s) => { const t = Date.parse(val(s)); return Number.isFinite(t) ? t : undefined; };

  async function carregarVendas() {
    const params = {
      start_date: parseDateOrUndef('#hot-start'),
      end_date:   parseDateOrUndef('#hot-end'),
      product_id: val('#hot-product') || undefined,
      transaction_status: val('#hot-status') || undefined,
      buyer_email: val('#hot-email') || undefined,
      offer_code: val('#hot-offer') || undefined,
    };
    const { items, count } = await window.HotmartBridge.listSales(params);
    // usa os renderizadores do ui.js
    if (typeof window.renderTabelaVendas === 'function') window.renderTabelaVendas(items);
    const status = $('#hm-status'); if (status) status.textContent = `Vendas carregadas: ${count}`;
  }

  async function carregarAssinaturas() {
    const params = {
      status:   val('#sub-status') || undefined,
      plan_id:  val('#sub-plan') || undefined,
      start_date: parseDateOrUndef('#sub-start'),
      end_date:   parseDateOrUndef('#sub-end'),
    };
    const { items, count } = await window.HotmartBridge.listSubscriptions(params);
    if (typeof window.renderTabelaAssinaturas === 'function') window.renderTabelaAssinaturas(items);
    const status = $('#hm-status'); if (status) status.textContent = `Assinaturas carregadas: ${count}`;
  }

  async function init() {
    if (window.HotmartBridge?.init) window.HotmartBridge.init();
    try {
      await carregarVendas();
      // Se quiser: await carregarAssinaturas();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }

    const btnVendas = $('#hot-refresh');
    if (btnVendas) btnVendas.addEventListener('click', () => carregarVendas());
    const btnSubs = $('#sub-refresh');
    if (btnSubs) btnSubs.addEventListener('click', () => carregarAssinaturas());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
