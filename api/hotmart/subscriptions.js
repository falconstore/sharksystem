// api/hotmart/subscriptions.js
// Lista assinaturas/assinantes com paginação completa.

import { hotmartPaginated } from "./_client.js";

/**
 * Query params aceitos (todos opcionais):
 * - status     (ex.: ACTIVE, CANCELED, OVERDUE...)
 * - plan_id
 * - start_date (timestamp ms)
 * - end_date   (timestamp ms)
 * - limit
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { status, plan_id, start_date, end_date, limit } = req.query;

    // Endpoint de assinaturas/assinantes segundo a doc.
    const path = "/docs/en/v1/subscription/get-subscribers";

    const items = await hotmartPaginated(path, {
      query: { status, plan_id, start_date, end_date },
      maxPerPage: 1000,
      limit: limit ? Number(limit) : Infinity,
    });

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
