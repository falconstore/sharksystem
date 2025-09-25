// api/hotmart/sales.js
// Lista Sales History com paginação completa e filtros opcionais.

import { hotmartPaginated } from "./_client.js";

/**
 * Query params aceitos (todos opcionais):
 * - product_id
 * - buyer_email
 * - offer_code
 * - transaction_status (ex.: APPROVED, CANCELED...)
 * - start_date (timestamp ms)
 * - end_date   (timestamp ms)
 * - limit      (corte no total a retornar, default: sem limite)
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      product_id,
      buyer_email,
      offer_code,
      transaction_status,
      start_date,
      end_date,
      limit,
    } = req.query;

    // Caminho do endpoint Sales History segundo a doc.
    // Ajuste apenas se sua conta exigir um prefixo diferente.
    const path = "/docs/en/v1/sales/sales-history";

    const items = await hotmartPaginated(path, {
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
