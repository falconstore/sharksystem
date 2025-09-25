// api/hotmart/_client.js
// Cliente HTTP Hotmart — OAuth2 Client Credentials + cache simples de token + paginação.
// Mantém credenciais seguras no server e evita CORS no front.

import fetch from "node-fetch";

// Variáveis de ambiente (configure na Vercel/Local)
const {
  HOTMART_CLIENT_ID,
  HOTMART_CLIENT_SECRET,
  // Token URL/documentação de autenticação OAuth2
  // Docs Hotmart: OAuth 2.0 (App Auth). Ajuste a URL conforme o ambiente/documentação do seu app.
  HOTMART_TOKEN_URL = "https://developers.hotmart.com/oauth/token",
  // Base dos endpoints de API
  HOTMART_API_BASE = "https://developers.hotmart.com",
} = process.env;

// Cache em memória (por instância da função serverless)
let cachedToken = null; // { access_token, token_type, expires_at }

async function fetchToken() {
  if (!HOTMART_CLIENT_ID || !HOTMART_CLIENT_SECRET) {
    throw new Error("HOTMART_CLIENT_ID/HOTMART_CLIENT_SECRET não configurados.");
  }

  // OAuth2 Client Credentials: Authorization: Basic base64(client_id:client_secret)
  const basic = Buffer.from(`${HOTMART_CLIENT_ID}:${HOTMART_CLIENT_SECRET}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(HOTMART_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart OAuth error: ${res.status} ${t}`);
  }

  const json = await res.json();
  // json esperado: { access_token, token_type, expires_in, ... }
  const expires_at = Date.now() + Math.max(0, (json.expires_in ?? 1800) - 60) * 1000; // renova 1 min antes
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
  const { access_token } = await getToken();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }

  const url =
    `${HOTMART_API_BASE}${path}${qs.toString() ? "?" + qs.toString() : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart API GET ${path} → ${res.status} ${t}`);
  }

  return res.json();
}

// Varredura de paginação baseada em next_page_token + max_results
export async function hotmartPaginated(
  path,
  { query = {}, maxPerPage = 1000, limit = Infinity } = {}
) {
  let items = [];
  let page_token = query.page_token || null;

  do {
    const pageQuery = {
      ...query,
      max_results: maxPerPage,
      ...(page_token ? { page_token } : {}),
    };

    const pageData = await hotmartGet(path, { query: pageQuery });

    // Alguns endpoints devolvem `items`, outros `data`
    const batchItems = pageData.items || pageData.data || [];
    items = items.concat(batchItems);

    // Metadados de paginação (padrão da doc: page_info.next_page_token)
    const pageInfo = pageData.page_info || {};
    page_token = pageInfo.next_page_token || null;

    if (items.length >= limit) break;
  } while (page_token);

  return items.slice(0, limit);
}
