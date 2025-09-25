// api/hotmart/subscriptions.js
import { hotmartPaginated } from "./_client.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const { status, plan_id, start_date, end_date, limit } = req.query;

    const items = await hotmartPaginated("/docs/en/v1/subscription/subscribers", {
      // endpoint "Get subscribers" / "Get subscriptions". :contentReference[oaicite:8]{index=8}
      query: { status, plan_id, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity,
    });

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
