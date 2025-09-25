// src/features/hotmart/controle.js
async function fetchSales(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/hotmart/sales?${qs}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erro ao buscar vendas");
  return json;
}

// No mount / ao clicar "Atualizar"
(async () => {
  try {
    // filtros usuais que você já tem nos inputs da aba:
    const start_date = Date.parse(document.querySelector("#hot-start").value); // pegue do seu form
    const end_date = Date.parse(document.querySelector("#hot-end").value);
    const product_id = document.querySelector("#hot-product").value || undefined;
    const transaction_status = document.querySelector("#hot-status").value || undefined;

    const { items, count } = await fetchSales({
      start_date,
      end_date,
      product_id,
      transaction_status,
    });

    // renderize sua tabela atual com 'items'
    renderTabelaVendas(items);
    showToast(`Hotmart: ${count} vendas carregadas`);
  } catch (e) {
    showError(e.message);
  }
})();
