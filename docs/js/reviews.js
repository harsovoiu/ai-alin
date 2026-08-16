// ============================================================
// REVIEWS.JS - Recenzii "Ai Alin"
// - salvate local (localStorage) + trimise catre backend daca exista
// ============================================================

var REVIEW_KEY = "aialin_reviews";
var REVIEW_DEFAULTS = [
  { n: "Andrei M.", s: 5, t: "Am intrat la un diagnostic pe un BMW 320d care nu mergea curat la rece. Mi-au explicat tot codul de eroare, de ce apare și cât costă înainte de a schimba ceva. Recomand!", d: "2026-07-10T10:00:00.000Z" },
  { n: "Elena P.", s: 5, t: "Mașina avea un zgomot la motor pe care alt service nu îl găsea. Aici au localizat repede rulmentul de la alternator. Rapid, curat și preț corect.", d: "2026-07-22T10:00:00.000Z" },
  { n: "Costică V.", s: 5, t: "A mercedes 200 CDI, schimb de distribuție + ulei. Au răspuns și pe WhatsApp la orice întrebare. De acum pe aici o întrețin mașina.", d: "2026-08-01T10:00:00.000Z" }
];

var reviews = [];
var reviewRating = 0;

function loadReviews() {
  try {
    var raw = localStorage.getItem(REVIEW_KEY);
    if (raw) { reviews = JSON.parse(raw); return; }
  } catch (e) {}
  reviews = REVIEW_DEFAULTS.slice();
}

function escHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function starsHtml(n) {
  var out = "";
  for (var i = 1; i <= 5; i++) out += "★";
  var f = Math.round(n);
  var filled = "";
  for (var j = 0; j < 5; j++) filled += j < f ? "★" : "☆";
  return filled;
}

function renderReviews() {
  var grid = document.getElementById("reviewsGrid");
  if (!grid) return;
  if (!reviews.length) {
    grid.innerHTML = '<div class="rev-empty">Încă nu sunt recenzii. Fii primul care lasă o părere!</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < reviews.length; i++) {
    var r = reviews[i];
    var date = "";
    if (r.d) {
      try {
        date = new Date(r.d).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" });
      } catch (e) {}
    }
    html += '<div class="review-card">'
      + '<div class="review-stars">' + starsHtml(r.s) + '</div>'
      + '<div class="review-name">' + escHtml(r.n) + '</div>'
      + (date ? '<div class="review-date">' + date + '</div>' : "")
      + '<div class="review-text">' + escHtml(r.t) + '</div>'
      + '</div>';
  }
  grid.innerHTML = html;
}

function openReviewModal() {
  reviewRating = 0;
  document.getElementById("revName").value = "";
  document.getElementById("revText").value = "";
  document.getElementById("revHint").style.display = "none";
  refreshStarUI();
  document.getElementById("reviewModal").classList.add("open");
}

function closeReviewModal() {
  document.getElementById("reviewModal").classList.remove("open");
}

function pickReviewStar(v) {
  reviewRating = v;
  refreshStarUI();
}

function refreshStarUI() {
  var btns = document.querySelectorAll("#revStars .rev-star");
  for (var i = 0; i < btns.length; i++) {
    var v = parseInt(btns[i].getAttribute("data-v"), 10);
    if (v <= reviewRating) btns[i].classList.add("on");
    else btns[i].classList.remove("on");
  }
}

function saveReview() {
  var hint = document.getElementById("revHint");
  var name = (document.getElementById("revName").value || "").trim();
  var text = (document.getElementById("revText").value || "").trim();
  if (!name) { hint.style.display = "block"; hint.textContent = "Scrie numele tău."; return; }
  if (!reviewRating) { hint.style.display = "block"; hint.textContent = "Alege numărul de stele."; return; }
  if (!text) { hint.style.display = "block"; hint.textContent = "Scrie câteva cuvinte despre experiența ta."; return; }
  var rec = {
    n: name,
    s: reviewRating,
    t: text,
    d: new Date().toISOString()
  };
  reviews.unshift(rec);
  reviews = reviews.slice(0, 200);
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews)); } catch (e) {}
  renderReviews();
  closeReviewModal();
  syncReviewToCloud(rec);
  var cta = document.querySelector(".reviews-cta");
  if (cta) {
    var old = cta.innerHTML;
    cta.innerHTML = '<p class="review-thanks">Mulțumim pentru recenzie! 🙏</p>';
    setTimeout(function () { cta.innerHTML = old; }, 3500);
  }
}

function syncReviewToCloud(rec) {
  try {
    if (typeof CLOUD_URL === "undefined" || typeof CLOUD_TOKEN === "undefined") return;
    fetch(CLOUD_URL + "/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Ai-Alin-Token": CLOUD_TOKEN },
      body: JSON.stringify(rec)
    }).catch(function () {});
  } catch (e) {}
}

loadReviews();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderReviews);
} else {
  renderReviews();
}