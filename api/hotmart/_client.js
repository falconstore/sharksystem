// api/hotmart/_client.js
// Hotmart (server): OAuth2 Client Credentials + cache de token + GET + paginação.

const {
  HOTMART_CLIENT_ID,
  HOTMART_CLIENT_SECRET,
  // Token real (região VLC). Pode mudar; deixe configurável por env.
  HOTMART_TOKEN_URL = "https://api-sec-vlc.hotmart.com/security/oauth/token",
  // MUITO IMPORTANTE: API base de dados (documentação aponta /v1/...).
  // Se sua conta usar outro host/região, ajuste via env.
  HOTMART_API_BASE = "https://developers.hotmart.com"
} = process.env;

let cachedToken = null; // { access_token, token_type, expires_at }

async function fetchToken() {
  if (!HOTMART_CLIENT_ID || !HOTMART_CLIENT_SECRET) {
    throw new Error("HOTMART_CLIENT_ID/HOTMART_CLIENT_SECRET ausentes");
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
    console.error("OAuth error:", res.status, t);
    throw new Error(`Hotmart OAuth error: ${res.status}`);
  }

  const json = await res.json();
  const expires_at = Date.now() + Math.max(0, (json.expires_in ?? 1800) - 60) * 1000;
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
    headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" }
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("Hotmart API error:", res.status, url, t.slice(0, 400));
    // Se a Hotmart retornar HTML (erro), devolvemos texto pro caller decidir
    // mas mantendo a exceção pra cair no handler e voltar JSON de erro ao front.
    throw new Error(`Hotmart API GET ${path} → ${res.status}`);
  }

  // Tenta JSON, mas se vier algo diferente por erro de proxy, faz fallback pra texto
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    try { return JSON.parse(text); } catch {
      console.error("Resposta não-JSON da Hotmart:", url, text.slice(0, 400));
      throw new Error("Resposta não-JSON da Hotmart");
    }
  }
  return res.json();
}

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
