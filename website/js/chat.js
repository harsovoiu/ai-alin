// ============================================================
// CHAT.JS — Interfața chat "Ai Alin"
// ============================================================

const chatPanel = document.getElementById("chatPanel");
const chatBody = document.getElementById("chatBody");
const chatInput = document.getElementById("chatInput");
let greeted = false;
let history = [];
let typing = false;

function toggleChat() {
  const open = chatPanel.classList.toggle("open");
  chatPanel.setAttribute("aria-hidden", String(!open));
  if (open) {
    if (!greeted) {
      greeted = true;
      botSay("Salut! 👋 Eu sunt **Ai Alin** — mecanic, electrician și diagnosticar auto, specializat pe **Audi, BMW și Mercedes**.\n\nDescrie-mi ce problemă are mașina ta (simptome, coduri de eroare, zgomote) și te ajut pas cu pas. 🚗🔧");
    }
    chatInput.focus();
  }
}

function openChat() {
  if (!chatPanel.classList.contains("open")) toggleChat();
}

function addMsg(text, who) {
  const el = document.createElement("div");
  el.className = "msg " + who;
  el.innerHTML = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}

function botSay(text) {
  const el = addMsg(text, "bot");
  return el;
}

function botSayTyped(text, delay) {
  addMsg("…", "bot loading");
  const load = chatBody.lastElementChild;
  setTimeout(() => {
    if (load) load.remove();
    botSay(text);
  }, delay || 700);
}

function sendMessage(e) {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val || typing) return;
  chatInput.value = "";
  addMsg(val, "user");
  history.push({ who: "user", text: val });
  typing = true;
  setTimeout(() => {
    const reply = getAnswer(val);
    botSay(reply);
    history.push({ who: "bot", text: reply });
    typing = false;
  }, 600 + Math.random() * 500);
}

function quickAsk(q) {
  if (chatPanel.classList.contains("open") === false) openChat();
  chatInput.value = q;
  sendMessage(new Event("submit"));
}

document.getElementById("year").textContent = new Date().getFullYear();
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});