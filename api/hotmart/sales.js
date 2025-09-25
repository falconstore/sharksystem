// Sales History com paginação total
const { hotmartPaginated } = require("./_client.js");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const {
      product_id,
      buyer_email,
      offer_code,
      transaction_status,
      start_date,
      end_date,
      limit
    } = req.query;

    // Ajuste o path conforme sua conta/documentação.
    const path = "/docs/en/v1/sales/sales-history";

    const items = await hotmartPaginated(path, {
      query: { product_id, buyer_email, offer_code, transaction_status, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity
    });

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
