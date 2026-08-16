// Ai Alin — Cloudflare Worker: proxy OpenAI-compatibil (ascunde cheia API)
// Endpointuri:
//   POST /chat       { messages: [...], model?: "..." }   (necesita X-Ai-Alin-Token)
//   GET  /reviews    -> { reviews: [...] }
//   POST /reviews    { n: nume, s: stele, t: text, d?: data }  (necesita X-Ai-Alin-Token)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Ai-Alin-Token"
};

// Limitare in-memory (se resetează la redeploy): max 12 req / 60s / IP
const RATE = { max: 12, windowMs: 60000, hits: new Map() };

const MAX_REVIEWS = 300;

function clientIP(req) {
  return req.headers.get("cf-connecting-ip") || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  let arr = RATE.hits.get(ip) || [];
  arr = arr.filter((t) => now - t < RATE.windowMs);
  if (arr.length >= RATE.max) {
    RATE.hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  RATE.hits.set(ip, arr);
  return false;
}

function hasToken(req, env) {
  return (req.headers.get("X-Ai-Alin-Token") || "") === env.SHARED_TOKEN;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const ip = clientIP(request);
    if (rateLimited(ip)) {
      return json({ error: "Prea multe solicitări. Așteaptă un minut." }, 429, CORS);
    }

    if (path.endsWith("/reviews")) {
      if (request.method === "GET") return listReviews(request, env);
      if (request.method === "POST") return addReview(request, env);
      if (request.method === "DELETE") return resetReviews(request, env);
      return json({ error: "Method not allowed." }, 405, CORS);
    }

    if (path.endsWith("/chat") && request.method === "POST") {
      return chat(request, env);
    }

    return json({ error: "Not found. Use POST /chat sau /reviews." }, 404, CORS);
  }
};

async function listReviews(request, env) {
  const keys = await env.AIALIN_KV.list({ prefix: "rev:", limit: MAX_REVIEWS });
  const out = [];
  const batch = [];
  for (const k of keys.keys) {
    batch.push(env.AIALIN_KV.get(k.name, { type: "text" }));
  }
  const values = await Promise.all(batch);
  for (let i = 0; i < values.length; i++) {
    try {
      out.push(JSON.parse(values[i]));
    } catch (e) { /* sarim peste valori corupte */ }
  }
  out.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
  return json({ reviews: out }, 200, CORS, { "Cache-Control": "public, max-age=60" });
}

async function resetReviews(request, env) {
  if (!hasToken(request, env)) {
    return json({ error: "Token invalid." }, 403, CORS);
  }
  try {
    let cursor = undefined;
    do {
      const page = await env.AIALIN_KV.list({ prefix: "rev:", limit: 1000, cursor });
      await Promise.all(page.keys.map((k) => env.AIALIN_KV.delete(k.name)));
      cursor = page.cursor;
    } while (cursor);
  } catch (e) {
    return json({ error: "Reset eșuat: " + e.message }, 500, CORS);
  }
  return json({ ok: true }, 200, CORS);
}

async function addReview(request, env) {
  if (!hasToken(request, env)) {
    return json({ error: "Token invalid." }, 403, CORS);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "JSON invalid." }, 400, CORS);
  }
  const n = String(body.n || "").trim().slice(0, 60);
  const s = Math.min(5, Math.max(1, Math.round(Number(body.s) || 0)));
  const t = String(body.t || "").trim().slice(0, 1000);
  if (!n || !t) return json({ error: "Nume și text obligatorii." }, 400, CORS);
  const d = String(body.d || "").trim() || new Date().toISOString();
  const rec = { n: n, s: s, t: t, d: d };
  const key = "rev:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
  await env.AIALIN_KV.put(key, JSON.stringify(rec));
  await prune(env);
  return json({ ok: true, review: rec }, 200, CORS);
}

async function prune(env) {
  try {
    const listed = await env.AIALIN_KV.list({ prefix: "rev:", limit: MAX_REVIEWS + 100 });
    const extra = listed.keys.length - MAX_REVIEWS;
    if (extra > 0) {
      await Promise.all(listed.keys.slice(0, extra).map((k) => env.AIALIN_KV.delete(k.name)));
    }
    const all = await env.AIALIN_KV.list({ prefix: "rev:" });
    const toDelete = all.keys.length - MAX_REVIEWS;
    if (toDelete > 0) {
      await Promise.all(all.keys.slice(0, toDelete).map((k) => env.AIALIN_KV.delete(k.name)));
    }
  } catch (e) { /* pruned best-effort */ }
}

async function chat(request, env) {
  if (!hasToken(request, env)) {
    return json({ error: "Token invalid." }, 403, CORS);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: "JSON invalid." }, 400, CORS);
  }

  const baseUrl = (env.PROVIDER_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = payload.model || env.PROVIDER_MODEL || "gpt-4o-mini";
  const messages = Array.isArray(payload.messages) ? payload.messages : null;
  if (!messages) return json({ error: "Mesaje lipsă." }, 400, CORS);

  let up;
  try {
    up = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.PROVIDER_KEY
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: payload.temperature !== undefined ? payload.temperature : 0.4,
        max_tokens: payload.max_tokens !== undefined ? payload.max_tokens : 900
      })
    });
  } catch (e) {
    return json({ error: "Furnizor indisponibil: " + e.message }, 502, CORS);
  }

  const respBody = await up.text();
  if (!up.ok) {
    return json({ error: "Eroare AI (" + up.status + "): " + respBody.slice(0, 300) }, 502, CORS);
  }

  return json({ content: respBody }, 200, CORS, {
    "Cache-Control": "no-store"
  });
}

function json(data, status, cors, extra) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, cors, extra || {})
  });
}