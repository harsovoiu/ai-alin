// ============================================================
// CHAT.JS — Interfața chat "Ai Alin" + integrare AI
// - implicit: AI cloud prin Cloudflare Worker (fără cheie pentru vizitatori)
// - opțional: cheie personală în browser (localStorage, doar pe device)
// - fallback: baza de cunoștințe locală
// ============================================================

var chatPanel = document.getElementById("chatPanel");
var chatBody = document.getElementById("chatBody");
var chatInput = document.getElementById("chatInput");
var AI_STATUS = document.getElementById("aiStatus");
var greeted = false;
var chatHistory = [];
var typing = false;

var CLOUD_URL = "https://ai-alin.aialin.workers.dev";
var CLOUD_TOKEN = "b03c4da3747e9a44965f9e92c1c4854d3f2ff074ca7b3760";

var AI_DEFAULTS = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  key: ""
};

function loadAISettings() {
  try {
    var raw = localStorage.getItem("aialin_ai");
    if (!raw) return JSON.parse(JSON.stringify(AI_DEFAULTS));
    var s = JSON.parse(raw);
    return {
      baseUrl: s.baseUrl || AI_DEFAULTS.baseUrl,
      model: s.model || AI_DEFAULTS.model,
      key: s.key || ""
    };
  } catch (e) { return JSON.parse(JSON.stringify(AI_DEFAULTS)); }
}

function saveAISettings(s) {
  localStorage.setItem("aialin_ai", JSON.stringify(s));
}

function refreshAIStatus() {
  if (!AI_STATUS) return;
  var s = loadAISettings();
  if (s.key && s.baseUrl) {
    AI_STATUS.textContent = "● AI personal — " + (s.model || "");
    AI_STATUS.classList.add("on");
    AI_STATUS.classList.remove("off");
  } else {
    AI_STATUS.textContent = "● AI cloud activ — expert auto";
    AI_STATUS.classList.add("on");
    AI_STATUS.classList.remove("off");
  }
}

function toggleChat() {
  var open = chatPanel.classList.toggle("open");
  chatPanel.setAttribute("aria-hidden", String(!open));
  if (open) {
    if (!greeted) {
      greeted = true;
      botSay("Salut! 👋 Eu sunt **Ai Alin** — mecanic, electrician și diagnosticar auto, specializat pe **Audi, BMW și Mercedes**.\n\nDescrie-mi ce problemă are mașina ta (simptome, coduri de eroare, zgomote) și te ajut pas cu pas. 🚗🔧\n\nℹ️ Răspund cu **AI** (expert auto) pentru toți vizitatorii. Dacă vrei să folosești propria cheie, apasă ⚙ — altfel nu trebuie să faci nimic.");
    }
    chatInput.focus();
  }
}

function openChat() {
  if (!chatPanel.classList.contains("open")) toggleChat();
}

function addMsg(text, who) {
  var el = document.createElement("div");
  el.className = "msg " + who;
  el.innerHTML = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}

function botSay(text) { return addMsg(text, "bot"); }

// ---------- Întrebare către AI (OpenAI-compatibil) ----------
var SYSTEM_PROMPT = "Esti A I ALIN, un mecanic auto, electrician auto si specialist in diagnoza auto din Romania, cu peste 20 de ani de experienta, specializat pe Audi, BMW si Mercedes.\n\nReguli:\n- Raspunzi intotdeauna in limba romana, prietenos si direct, ca un mecanic de incredere.\n- Daca lipsesc detalii importante, pui intrebari de clarificare: marca, model, an, motor, simptome, coduri de eroare.\n- Pentru diagnostic: simptom -> cauze probabile ordonate -> pasi de verificare -> reparatie recomandata + cost orientativ in lei -> sfaturi de preventie.\n- Cand cineva da un cod de eroare (DTC), explici ce inseamna, cauzele posibile si pasii de verificare; nu inventa coduri.\n- Mentionezi masuri de siguranta cand e vorba de electrica, gaze, ulei, substante periculoase sau lucrari riscante.\n- Recomanzi aparatura potrivita marcii: Audi/VAG -> VCDS sau OBD11, BMW -> ISTA/INPA/Carly, Mercedes -> XENTRY/DAS.\n- Daca nu esti sigur, spui sincer si recomanzi verificare cu aparatul de diagnoza sau la service autorizat.\n- Eviti jargonul inutil; daca folosesti termeni tehnici, ii explici scurt.\n- Preturile sunt orientative, in lei, doar ca referinta generala.\n- Costurile care iti pot lipsi: nu ghicesti specificatii tehnice exacte pe care nu le stii sigur; ceri datele.\n- Esti un asistent informativ, nu oferi garantii de reparație a unui autovehicul din depărtare; recomanzi verificarea fizica a vehiculului.";

function buildAiMessages() {
  var msgs = [{ role: "system", content: SYSTEM_PROMPT }];
  var tail = chatHistory.slice(-12);
  for (var i = 0; i < tail.length; i++) {
    msgs.push({
      role: tail[i].who === "user" ? "user" : "assistant",
      content: tail[i].text
    });
  }
  return msgs;
}

function callAI(userText) {
  return new Promise(function (resolve, reject) {
    var s = loadAISettings();
    if (s.key && s.baseUrl) {
      // 1. Cheie personală (browser) — direct la furnizor
      callDirectAI(s).then(resolve).catch(reject);
    } else {
      // 2. AI cloud prin Worker — pentru toți vizitatorii
      callCloudAI().then(resolve).catch(reject);
    }
  });
}

function callDirectAI(s) {
  return new Promise(function (resolve, reject) {
    var base = s.baseUrl.replace(/\/+$/, "");
    var body = {
      model: s.model || AI_DEFAULTS.model,
      messages: buildAiMessages(),
      temperature: 0.4,
      max_tokens: 900
    };
    fetchWithTimeout(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.key },
      body: JSON.stringify(body)
    }, 45000).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { reject(new Error("HTTP " + r.status + " " + t.slice(0, 200))); });
      return r.json();
    }).then(function (data) {
      var out = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (out) resolve(out);
      else reject(new Error("Răspuns AI gol — verifică modelul setat."));
    }).catch(function (e) { reject(e); });
  });
}

function fetchWithTimeout(url, opts, ms) {
  if (typeof AbortController === "undefined") return fetch(url, opts);
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, ms || 45000);
  opts = Object.assign({}, opts, { signal: ctrl.signal });
  return fetch(url, opts).then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
}

function callCloudAI() {
  return new Promise(function (resolve, reject) {
    var body = {
      messages: buildAiMessages(),
      temperature: 0.4,
      max_tokens: 900
    };
    fetchWithTimeout(CLOUD_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Ai-Alin-Token": CLOUD_TOKEN },
      body: JSON.stringify(body)
    }, 45000).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { reject(new Error("HTTP " + r.status + " " + t.slice(0, 200))); });
      return r.json();
    }).then(function (data) {
      if (data && data.content) {
        var parsed = JSON.parse(data.content);
        var out = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
        if (out) resolve(out);
        else reject(new Error("Răspuns AI goal."));
      } else {
        reject(new Error(data && data.error ? data.error : "Răspuns neașteptat."));
      }
    }).catch(function (e) { reject(e); });
  });
}

// ---------- Trimitere mesaj ----------
function sendMessage(e) {
  e.preventDefault();
  var val = chatInput.value.trim();
  if (!val || typing) return;
  chatInput.value = "";
  addMsg(val, "user");
  chatHistory.push({ who: "user", text: val });
  typing = true;
  addMsg("… scrie Ai Alin…", "bot loading");
  var loadEl = chatBody.lastElementChild;

  callAI(val).then(function (aiReply) {
    setTimeout(function () {
      if (loadEl) loadEl.remove();
      if (aiReply) {
        chatHistory.push({ who: "bot", text: aiReply });
        botSay(aiReply);
      } else {
var local = getAnswer(val);
      chatHistory.push({ who: "bot", text: local });
      botSay(local);
      }
      typing = false;
    }, 300);
  }).catch(function (err) {
    setTimeout(function () {
      if (loadEl) loadEl.remove();
      var local = getAnswer(val);
      var note = "⚠️ AI-ul a dat o eroare (**" + err.message + "**) — ți-am răspuns din baza locală:\n\n";
      chatHistory.push({ who: "bot", text: local });
      botSay(note + local);
      typing = false;
    }, 300);
  });
}

function quickAsk(q) {
  if (!chatPanel.classList.contains("open")) openChat();
  chatInput.value = q;
  sendMessage(new Event("submit"));
}

// ---------- Setări AI ----------
function openSettings() {
  var modal = document.getElementById("aiSettings");
  var s = loadAISettings();
  document.getElementById("aiUrl").value = s.baseUrl;
  document.getElementById("aiModel").value = s.model;
  document.getElementById("aiKey").value = s.key;
  modal.classList.add("open");
}

function closeSettings() {
  document.getElementById("aiSettings").classList.remove("open");
}

function saveSettings() {
  var s = {
    baseUrl: document.getElementById("aiUrl").value.trim() || AI_DEFAULTS.baseUrl,
    model: document.getElementById("aiModel").value.trim() || AI_DEFAULTS.model,
    key: document.getElementById("aiKey").value.trim()
  };
  saveAISettings(s);
  refreshAIStatus();
  closeSettings();
  if (s.key) botSay("✅ AI activat cu **" + s.model + "**. Cheia ta e salvată doar în acest browser. Întreabă-mă orice despre mașină!");
  else botSay("ℹ️ AI dezactivat — răspund din baza locală. Le poți adăuga oricând din ⚙.");
}

document.getElementById("year").textContent = new Date().getFullYear();
refreshAIStatus();
chatInput.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });

if (/(^|[?&])chat=1(&|$)/.test(location.search)) {
  setTimeout(function () { openChat(); }, 350);
}