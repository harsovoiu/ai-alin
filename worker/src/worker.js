// Ai Alin — Cloudflare Worker: proxy OpenAI-compatibil (ascunde cheia API)
// Endpoint: POST /chat  { messages: [...], model?: "..." }
// Protecție minimă: token partajat + limitare simplistă per IP.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Ai-Alin-Token"
};

// Limitare in-memory (se resetează la redeploy): max 12 req / 60s / IP
const RATE = { max: 12, windowMs: 60000, hits: new Map() };

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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: CORS });
    }
    if (request.method !== "POST") {
      return new Response("Use POST /chat", { status: 405, headers: CORS });
    }

    const ip = clientIP(request);
    if (rateLimited(ip)) {
      return json({ error: "Prea multe solicitări. Așteaptă un minut." }, 429, CORS);
    }

    const clientToken = request.headers.get("X-Ai-Alin-Token") || "";
    if (clientToken !== env.SHARED_TOKEN) {
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
};

function json(data, status, cors, extra) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, cors, extra || {})
  });
}