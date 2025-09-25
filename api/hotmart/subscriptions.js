// api/hotmart/subscriptions.js
// Subscriptions — lista assinantes/assinaturas com paginação.
// Doc: Get subscriptions/subscribers — /v1/subscription/get-subscribers
// https://developers.hotmart.com/docs/en/v1/subscription/get-subscribers/

const { hotmartPaginated } = require("./_client.js");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const { status, plan_id, start_date, end_date, limit } = req.query;

    const path = "/v1/subscription/get-subscribers";

    const items = await hotmartPaginated(path, {
      query: { status, plan_id, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity
    });

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
