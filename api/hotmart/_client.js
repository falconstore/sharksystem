// api/hotmart/_client.js
// Cliente Hotmart (server) — OAuth2 Client Credentials + cache de token + paginação.
// Mantém credenciais no servidor (Vercel) e evita CORS no front.

const {
  HOTMART_CLIENT_ID,
  HOTMART_CLIENT_SECRET,
  // Token URL real (padrão). Pode variar por região/ambiente; sobrescreva por env se precisar.
  // Fonte: guias de integração mostram api-sec-vlc.hotmart.com/security/oauth/token.
  HOTMART_TOKEN_URL = "https://api-sec-vlc.hotmart.com/security/oauth/token",
  // Base dos endpoints REST (os caminhos reais começam com /v1/...):
  // Doc oficial lista Sales History e Subscriptions sob /v1.
  HOTMART_API_BASE = "https://developers.hotmart.com"
} = process.env;

let cachedToken = null; // { access_token, token_type, expires_at }

async function fetchToken() {
  if (!HOTMART_CLIENT_ID || !HOTMART_CLIENT_SECRET) {
    throw new Error("Env HOTMART_CLIENT_ID/HOTMART_CLIENT_SECRET não configurados.");
  }
  const basic = Buffer.from(`${HOTMART_CLIENT_ID}:${HOTMART_CLIENT_SECRET}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(HOTMART_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart OAuth error: ${res.status} ${t}`);
  }

  const json = await res.json(); // { access_token, token_type, expires_in, ... }
  const expires_at = Date.now() + Math.max(0, (json.expires_in ?? 1800) - 60) * 1000; // renova 1min antes
  cachedToken = { ...json, expires_at };
  return cachedToken;
}

async function getToken() {
  if (!cachedToken || Date.now() >= cachedToken.expires_at) return fetchToken();
  return cachedToken;
}

async function hotmartGet(path, { query = {} } = {}) {
  const { access_token } = await getToken();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "" || Number.isNaN(v)) continue;
    qs.set(k, String(v));
  }

  const url = `${HOTMART_API_BASE}${path}${qs.toString() ? "?" + qs.toString() : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Hotmart API GET ${path} → ${res.status} ${t}`);
  }

  return res.json();
}

// Varre paginação (page_token/next_page_token + max_results)
async function hotmartPaginated(path, { query = {}, maxPerPage = 1000, limit = Infinity } = {}) {
  let items = [];
  let page_token = query.page_token || null;

  do {
    const pageQuery = {
      ...query,
      max_results: maxPerPage,
      ...(page_token ? { page_token } : {})
    };

    const pageData = await hotmartGet(path, { query: pageQuery });
    const batchItems = pageData.items || pageData.data || [];
    items = items.concat(batchItems);

    const pageInfo = pageData.page_info || {};
    page_token = pageInfo.next_page_token || null;

    if (items.length >= limit) break;
  } while (page_token);

  return items.slice(0, limit);
}

module.exports = { hotmartGet, hotmartPaginated };
