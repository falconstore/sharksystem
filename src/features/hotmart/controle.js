// src/features/hotmart/controle.js (exemplo mínimo)
async function fetchSales(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/hotmart/sales?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao buscar vendas");
  return data; // { items, count }
}

// Exemplo de uso (no onLoad/onClick)
(async () => {
  try {
    const start_date = Date.parse(document.querySelector("#hot-start").value || "");
    const end_date   = Date.parse(document.querySelector("#hot-end").value || "");
    const product_id = document.querySelector("#hot-product")?.value || undefined;
    const transaction_status = document.querySelector("#hot-status")?.value || undefined;

    const { items, count } = await fetchSales({
      start_date: isNaN(start_date) ? undefined : start_date,
      end_date:   isNaN(end_date)   ? undefined : end_date,
      product_id,
      transaction_status,
    });

    renderTabelaVendas(items);  // reaproveite sua função atual
    showToast?.(`Hotmart: ${count} registros carregados`);
  } catch (e) {
    showError?.(e.message);
    console.error(e);
  }
})();
