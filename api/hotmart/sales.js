// api/hotmart/sales.js
import { hotmartPaginated } from "./_client.js";

// Mapeie os query params que sua Aba Controle Hotmart já envia (datas, status, produto, e-mail, etc.)
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const {
      product_id,
      buyer_email,
      offer_code,
      transaction_status, // ex.: APPROVED, CANCELLED...
      start_date, // epoch millis
      end_date,   // epoch millis
      limit,      // opcional: quantos itens no total
    } = req.query;

    const items = await hotmartPaginated("/docs/en/v1/sales/history", {
      // OBS: alguns ambientes usam caminho /v1/sales/history — ajuste conforme seu endpoint base.
      // A referência de "Sales History" está na doc. :contentReference[oaicite:5]{index=5}
      query: {
        product_id,
        buyer_email,
        offer_code,
        transaction_status,
        start_date,
        end_date,
      },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity,
    });

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
