// api/hotmart/_client.js
// Cliente HTTP para Hotmart com OAuth2 + cache simples de token (memory cache por instância)

import fetch from "node-fetch";

const {
  HOTMART_CLIENT_ID,
  HOTMART_CLIENT_SECRET,
  HOTMART_API_BASE = "https://developers.hotmart.com",
} = process.env;

// cache em memória no escopo do módulo (persiste por instância serverless)
let cachedToken = null; // { access_token, token_type, expires_at }

async function fetchToken() {
  // Endpoint e corpo conforme OAuth2 (Hotmart)
  // Docs: autenticação via OAuth 2.0 (grant para apps) e uso de Bearer token. :contentReference[oaicite:2]{index=2}
  const url = `${HOTMART_API_BASE}/oauth/token`;
  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const basic = Buffer.from(`${HOTMART_CLIENT_ID}:${HOTMART_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart OAuth error: ${res.status} ${t}`);
  }

  const json = await res.json();
  // json: { access_token, token_type, expires_in }
  const expires_at = Date.now() + (json.expires_in - 60) * 1000; // renova 1 min antes
  cachedToken = { ...json, expires_at };
  return cachedToken;
}

async function getToken() {
  if (!cachedToken || Date.now() >= cachedToken.expires_at) {
    return fetchToken();
  }
  return cachedToken;
}

export async function hotmartGet(path, { query = {} } = {}) {
  const token = await getToken();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const url = `${HOTMART_API_BASE}${path}${qs.toString() ? "?" + qs.toString() : ""}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token.access_token}`,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart API GET ${path} → ${res.status} ${t}`);
  }

  return res.json();
}

// util para varrer paginação cursor-based (page_token + max_results)
// A paginação Hotmart retorna metadados (ex.: page_info, total_results, page_token). :contentReference[oaicite:3]{index=3}
export async function hotmartPaginated(path, { query = {}, maxPerPage = 1000, limit = Infinity } = {}) {
  let items = [];
  let page_token = query.page_token || null;

  do {
    const batch = await hotmartGet(path, {
      query: {
        ...query,
        max_results: maxPerPage,
        ...(page_token ? { page_token } : {}),
      },
    });

    const batchItems = batch.items || batch.data || [];
    items = items.concat(batchItems);

    const pageInfo = batch.page_info || {};
    page_token = pageInfo.next_page_token || null;

    if (items.length >= limit) break;
  } while (page_token);

  return items.slice(0, limit);
}
