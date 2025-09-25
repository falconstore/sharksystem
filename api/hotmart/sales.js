// api/hotmart/sales.js
// Sales History (vendas) com paginação total e erros SEMPRE em JSON.

const { hotmartPaginated } = require("./_client.js");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      product_id,
      buyer_email,
      offer_code,
      transaction_status,  // APPROVED, CANCELED, etc.
      start_date,          // epoch ms
      end_date,            // epoch ms
      limit
    } = req.query;

    const path = "/v1/sales/sales-history"; // endpoint real. Doc: Sales History.
    const items = await hotmartPaginated(path, {
      query: { product_id, buyer_email, offer_code, transaction_status, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity
    });

    return res.status(200).json({ items, count: items.length });
  } catch (err) {
    // Nunca devolve HTML — sempre JSON:
    console.error("sales handler error:", err && err.stack || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
};
