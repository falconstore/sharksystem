// api/hotmart/subscriptions.js
// Assinaturas/assinantes com paginação total e erros SEMPRE em JSON.

const { hotmartPaginated } = require("./_client.js");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { status, plan_id, start_date, end_date, limit } = req.query;

    const path = "/v1/subscription/get-subscribers"; // endpoint real. Doc: Get subscribers.
    const items = await hotmartPaginated(path, {
      query: { status, plan_id, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity
    });

    return res.status(200).json({ items, count: items.length });
  } catch (err) {
    console.error("subscriptions handler error:", err && err.stack || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
};
