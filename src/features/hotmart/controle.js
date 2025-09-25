// src/features/hotmart/controle.js
// Inicializa a aba Hotmart, usa HotmartBridge para buscar dados sem credenciais no front.

(function () {
  function q(sel) { return document.querySelector(sel); }
  function val(sel) { const el = q(sel); return el ? el.value : ''; }
  function parseDateOrUndef(sel) {
    const s = val(sel);
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : undefined;
  }

  // -------- Handlers de dados --------
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

    // Funções de render do seu sistema (já existentes):
    if (typeof renderTabelaVendas === 'function') renderTabelaVendas(items);
    if (typeof showToast === 'function') showToast(`Hotmart: ${count} vendas carregadas`);
  }

  async function carregarAssinaturas() {
    const params = {
      status:   val('#sub-status') || undefined,
      plan_id:  val('#sub-plan') || undefined,
      start_date: parseDateOrUndef('#sub-start'),
      end_date:   parseDateOrUndef('#sub-end'),
    };
    const { items, count } = await window.HotmartBridge.listSubscriptions(params);

    if (typeof renderTabelaAssinaturas === 'function') renderTabelaAssinaturas(items);
    if (typeof showToast === 'function') showToast(`Assinaturas: ${count} itens carregados`);
  }

  // -------- Init --------
  async function init() {
    // 1) Neutraliza o fluxo antigo de credenciais (se existir)
    if (window.HotmartBridge?.init) window.HotmartBridge.init();

    // 2) Carrega dados iniciais
    try {
      await carregarVendas();
      // Se quiser, descomente p/ carregar assinaturas na largada:
      // await carregarAssinaturas();
    } catch (e) {
      console.error(e);
      if (typeof showError === 'function') showError(e.message);
    }

    // 3) Eventos de UI existentes
    const btnVendas = q('#hot-refresh');
    if (btnVendas) btnVendas.addEventListener('click', () => carregarVendas());

    const btnSubs = q('#sub-refresh');
    if (btnSubs) btnSubs.addEventListener('click', () => carregarAssinaturas());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
