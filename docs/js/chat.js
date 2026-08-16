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
      if (voiceOutput) speak("Salut! Sunt Ai Alin, expert auto. Descrie-mi problema mașinii și te ajut pas cu pas.");
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
        speak(aiReply);
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
      speak(local);
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

// ---------- Voce: dictare (ro-RO) și citire cu voce ----------
var voiceOutput = false;
try { voiceOutput = localStorage.getItem("aialin_voice_out") === "1"; } catch (e) {}

function setStatusText(t) {
  if (AI_STATUS) AI_STATUS.textContent = t;
}

function voiceSupported() {
  return hasAndroidVoice || !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

var hasAndroidVoice = typeof window.AndroidVoice !== "undefined";

var voiceRecog = null;

function toggleVoiceInput() {
  var btn = document.getElementById("voiceBtn");
  if (hasAndroidVoice) {
    if (voiceRecog) {
      try { AndroidVoice.cancel(); } catch (e) {}
      voiceRecog = null;
      if (btn) btn.classList.remove("listening");
      refreshAIStatus();
      return;
    }
    window.onAndroidVoiceResult = function (t) {
      voiceRecog = null;
      if (btn) btn.classList.remove("listening");
      var val = (t || "").trim();
      chatInput.value = val;
      if (val) sendMessage(new Event("submit"));
      refreshAIStatus();
    };
    window.onAndroidVoiceError = function (e) {
      voiceRecog = null;
      if (btn) btn.classList.remove("listening");
      setStatusText("⚠️ " + e);
      setTimeout(refreshAIStatus, 8000);
    };
    voiceRecog = { listening: true };
    if (btn) btn.classList.add("listening");
    setStatusText("🎤 ascult... vorbește în română");
    try { AndroidVoice.startListening(); } catch (e2) {
      voiceRecog = null;
      if (btn) btn.classList.remove("listening");
      setStatusText("⚠️ microfon indisponibil");
      setTimeout(refreshAIStatus, 4000);
    }
    return;
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setStatusText("✖ dictarea vocală nu e suportată de acest browser");
    setTimeout(refreshAIStatus, 4000);
    return;
  }
  if (voiceRecog && voiceRecog.listening) {
    voiceRecog.stop();
    return;
  }
  var rec = new SR();
  rec.lang = "ro-RO";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  var done = false;
  rec.onresult = function (ev) {
    var t = (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || "";
    t = t.trim();
    chatInput.value = t;
    if (t && !done) {
      done = true;
      var val = t;
      chatInput.value = val;
      sendMessage(new Event("submit"));
    }
  };
  rec.onerror = function (ev) {
    done = true;
    if (btn) btn.classList.remove("listening");
    var code = (ev && ev.error) || "necunoscut";
    var msg;
    if (code === "not-allowed" || code === "service-not-allowed") msg = "⚠️ accesul la microfon a fost refuzat — apasă pe iconița de microfon din adresa browserului și permite accesul";
    else if (code === "no-speech") msg = "🎤 nu te-am auzit — vorbește aproape de microfon";
    else if (code === "audio-capture") msg = "⚠️ nu am găsit un microfon conectat";
    else if (code === "network") msg = "⚠️ recunoașterea vocală are nevoie de conexiune la internet";
    else msg = "⚠️ eroare voce: " + code;
    setStatusText(msg);
    setTimeout(refreshAIStatus, 7000);
  };
  rec.onend = function () {
    voiceRecog = null;
    if (btn) btn.classList.remove("listening");
    refreshAIStatus();
  };
  voiceRecog = rec;
  try {
    rec.start();
    if (btn) btn.classList.add("listening");
    setStatusText("🎤 ascult... vorbește în română");
  } catch (e) {
    voiceRecog = null;
    setStatusText("⚠️ microfon indisponibil");
    setTimeout(refreshAIStatus, 4000);
  }
}

function toggleVoiceOutput() {
  voiceOutput = !voiceOutput;
  try { localStorage.setItem("aialin_voice_out", voiceOutput ? "1" : "0"); } catch (e) {}
  var b = document.getElementById("voiceSpkBtn");
  if (b) {
    if (voiceOutput) { b.textContent = "🔊"; b.classList.add("on"); }
    else { b.textContent = "🔇"; b.classList.remove("on"); }
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setStatusText(voiceOutput ? "🔊 voi citi răspunsurile cu voce" : "🔇 citire cu voce oprită");
  setTimeout(refreshAIStatus, 3000);
  if (voiceOutput) speak("Salut! Sunt Ai Alin, expert auto. Îți voi răspunde și cu vocea. Întreabă-mă despre mașina ta.");
}

function pickRoVoice() {
  var vs = window.speechSynthesis.getVoices();
  for (var i = 0; i < vs.length; i++) {
    var v = vs[i];
    if ((v.lang && v.lang.indexOf("ro") === 0) || (v.name && /roman|romanian/i.test(v.name))) return v;
  }
  return null;
}

function speak(text) {
  if (!voiceOutput || !window.speechSynthesis) return;
  var clean = String(text || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/[_*`#>]/g, "").trim();
  if (!clean) return;
  try {
    var u = new SpeechSynthesisUtterance(clean);
    u.lang = "ro-RO";
    var rv = pickRoVoice();
    if (rv) u.voice = rv;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

(function initVoiceUI() {
  var b = document.getElementById("voiceSpkBtn");
  if (b) {
    if (voiceOutput) { b.textContent = "🔊"; b.classList.add("on"); }
    else b.textContent = "🔇";
    if (!window.speechSynthesis) b.style.display = "none";
  }
  var mb = document.getElementById("voiceBtn");
  if (mb && !voiceSupported()) mb.style.display = "none";
  if (window.speechSynthesis) window.speechSynthesis.getVoices();
})();

// ---------- Analiza sunetului de motor (Web Audio) ----------
var SOUND_DURATION = 6000;
var soundActive = false;

function startSoundAnalysis() {
  if (soundActive || typing) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !AC) {
    botSay("⚠️ Analiza sunetului nu e suportată de acest browser. Dacă folosești aplicația, actualizează la v1.1.");
    return;
  }
  openChat();
  soundActive = true;
  var loadEl = addMsg("🎙️ Ascult motorul ~6 secunde… ține telefonul aproape, departe de părți fierbinți și în mișcare", "bot loading");
  setStatusText("🎙️ ascult motorul...");
  var requested = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
  function start(stream) {
    var AC2 = window.AudioContext || window.webkitAudioContext;
    var ctx;
    try { ctx = new AC2(); } catch (e) { ctx = new AC2(); }
    var src = ctx.createMediaStreamSource(stream);
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser);

    var frames = [];
    var rmsLog = [];
    var freqBuf = new Uint8Array(analyser.frequencyBinCount);
    var timeBuf = new Uint8Array(analyser.fftSize);

    function rmsNow() {
      analyser.getByteTimeDomainData(timeBuf);
      var sum = 0;
      for (var i = 0; i < timeBuf.length; i++) {
        var v = (timeBuf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / timeBuf.length);
    }

    var t0 = Date.now();
    var iv = setInterval(function () {
      analyser.getByteFrequencyData(freqBuf);
      frames.push(new Uint8Array(freqBuf));
      rmsLog.push(rmsNow());
      if (Date.now() - t0 >= SOUND_DURATION) {
        clearInterval(iv);
        stream.getTracks().forEach(function (t) { t.stop(); });
        try { src.disconnect(); ctx.close(); } catch (e) {}
        soundAnalysisResult(frames, rmsLog, analyser, loadEl);
      }
    }, 120);
  }

  navigator.mediaDevices.getUserMedia(requested).then(start).catch(function () {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(start).catch(function (err) {
      soundActive = false;
      if (loadEl) loadEl.remove();
      setStatusText("⚠️ microfon indisponibil sau acces refuzat");
      setTimeout(refreshAIStatus, 6000);
      botSay("⚠️ Nu am putut accesa microfonul (permisiune refuzată sau lipsă). Permite microfonul și încearcă din nou.");
    });
  });
}

var finishAnalysis = null;

function soundAnalysisResult(frames, rmsLog, analyser, loadEl) {
  var binCount = analyser.frequencyBinCount;
  var sr = (analyser.context && analyser.context.sampleRate) || 44100;
  var avg = new Float32Array(binCount);
  for (var i = 0; i < binCount; i++) avg[i] = 0;
  frames.forEach(function (f) {
    for (var i = 0; i < binCount && i < f.length; i++) avg[i] += f[i];
  });
  for (var i = 0; i < binCount; i++) avg[i] = avg[i] / frames.length;

  var total = 0, sumF = 0, maxMag = 0, domIdx = 0;
  for (i = 1; i < binCount; i++) {
    total += avg[i];
    sumF += avg[i] * i;
    if (avg[i] > maxMag) { maxMag = avg[i]; domIdx = i; }
  }
  var centroidHz = total > 0 ? (sumF / total) * (sr / 2) / binCount : 0;
  var domHz = domIdx * (sr / 2) / binCount;

  function bandRatio(a, b) {
    var s = 0;
    for (i = a; i < b && i < binCount; i++) s += avg[i];
    return total > 0 ? s / total : 0;
  }
  var lowR = bandRatio(1, Math.floor(300 * binCount / (sr / 2)));
  var midR = bandRatio(Math.floor(300 * binCount / (sr / 2)), Math.floor(1500 * binCount / (sr / 2)));
  var highR = 1 - lowR - midR;

  var rmsAvg = 0;
  rmsLog.forEach(function (v) { rmsAvg += v; });
  rmsAvg = rmsAvg / (rmsLog.length || 1);
  var varSum = 0;
  rmsLog.forEach(function (v) { varSum += (v - rmsAvg) * (v - rmsAvg); });
  var rmsStd = Math.sqrt(varSum / (rmsLog.length || 1));

  var onsets = 0;
  for (i = 1; i < rmsLog.length; i++) {
    if (rmsLog[i] - rmsLog[i - 1] > 0.08) onsets++;
  }

  var tags = [];
  var chara = [];
  if (rmsAvg < 0.08) { tags.push("silent"); chara.push("intensitate scazuta"); }
  else if (rmsAvg < 0.2) { tags.push("moderate"); chara.push("intensitate medie"); }
  else { tags.push("loud"); chara.push("intensitate puternica"); }
  if (domHz < 80) { tags.push("joase"); chara.push("zgomot de frecventa foarte joasa (bord, greu)"); }
  else if (domHz < 200) { tags.push("joase"); chara.push("frecventa dominanta joasa"); }
  else if (domHz < 500) { tags.push("medii"); chara.push("frecventa dominanta medie-joasa"); }
  else if (domHz < 1500) { tags.push("medii"); chara.push("frecventa dominanta medie"); }
  else { tags.push("inalte"); chara.push("frecventa dominanta inalta (subtire)"); }
  if (highR > 0.35) { tags.push("inalte"); chara.push("proportie mare de sunete inalte (tiuit/soierat)"); }
  if (onsets >= 4) { tags.push("ritmic"); chara.push("ritmic/impulsiv"); }
  else if (rmsStd < 0.03) { tags.push("constant"); chara.push("constant, fara variatii mari"); }
  else { tags.push("variabil"); chara.push("intensitate variabila"); }
  if (centroidHz > 2000) { tags.push("inalte"); }

  var profile = "Am inregistrat sunetul motorului (~" + Math.floor(SOUND_DURATION / 1000) + " s):\n"
    + "- Frecventa dominanta: ~" + Math.round(domHz) + " Hz\n"
    + "- Centru spectral: ~" + Math.round(centroidHz) + " Hz\n"
    + "- Textura: " + Math.round(lowR * 100) + "% joase, " + Math.round(midR * 100) + "% medii, " + Math.round(highR * 100) + "% inalte\n"
    + "- " + chara.join("; ") + "\n"
    + "- Intensitate RMS: " + rmsAvg.toFixed(3);

  soundActive = false;
  setStatusText("🔍 analizez sunetul...");
  if (loadEl) loadEl.remove();

  addMsg("🔍 Ascultă motorul. Profil sunet:\n" + profile, "user");
  chatHistory.push({ who: "user", text: "[Analiza sunet motor] " + profile + "\n\nInterpreteaza ca un mecanic cu 20+ ani pe Audi/BMW/Mercedes: cauze probabile ordonate, cum verific, cost orientativ in lei si masuri de siguranta. Pune 1-2 intrebari scurte de clarificare (marca/model/an, cand apare zgomotul, la relanti sau turație)." });

  var load2 = addMsg("📊 Interpretez sunetul...", "bot loading");
  callAI("").then(function (aiReply) {
    setTimeout(function () {
      if (load2) load2.remove();
      chatHistory.push({ who: "bot", text: aiReply });
      botSay(aiReply);
      speak(aiReply);
    }, 300);
  }).catch(function (err) {
    setTimeout(function () {
      if (load2) load2.remove();
      var note = "⚠️ AI-ul n-a răspuns — ghid din baza locală:\n\n";
      var g = getSoundGuide(tags);
      chatHistory.push({ who: "bot", text: g });
      botSay(note + g);
      speak(g);
    }, 300);
  });
  setTimeout(function () { if (soundActive === false) refreshAIStatus(); }, 1200);
}

function getSoundGuide(tags) {
  var t = tags.join(",");
  if (t.indexOf("inalte") >= 0 && t.indexOf("constant") >= 0) {
    return "Sunet subtire/tiuit continuu — cel mai probabil: curea sau intinzator uzat, rulment de alternator/pompa de apa/compresor AC, sau admisie de aer. Bordura: verific curelele si rotitele (scoate-le si invartele manual), apoi localizeaza zgomotul cu un stetoscop mecanic. Nu deschide capota cu motorul in functiune peste elemente in miscare.";
  }
  if (t.indexOf("inalte") >= 0 && t.indexOf("ritmic") >= 0) {
    return "Tictac metalic ritmic — posibil hidraulica la supape, antrenament de distributie, sau injecție. Bordura: bara un CAES/serepide motorului directorii si contextora (la rece/la cald), verifica nivelul de ulei si tachetii hidraulici; la BMW un N47 poate sugera intinzator de lant.";
  }
  if (t.indexOf("joase") >= 0 && t.indexOf("ritmic") >= 0) {
    return "Bubuit/zgomot joas frecvent ritmic — sanse: paliere (brate/biela), ambreiaj amortizor volanta, distributie, sau compensatorii de pulsatie. Bordura: scade turajia la relanti si compari; daca sunetul se sincronizeaza cu turatia si creste la accelerare, e probabil la piese in rotatie. Pune o lama lunga/stetoscop pe palier si urmareste daca dingeta dispare cand e apasat ambreiajul (viteza) sau cu capcana ulei (distributie lant).";
  }
  return "Pentru un diagnostic corect e nevoie de context: marca si motorul (ex. Audi 2.0 TDI, BMW N47), anul, cand apare zgomotul (la rece/la cald, la relanti/acceleratie) si daca lumineza vreun martor. Pune-mi aceste detalii si iti dau cauzele probabile pas cu pas.";
}

function stopSoundStream() { /* helper - not used */ }