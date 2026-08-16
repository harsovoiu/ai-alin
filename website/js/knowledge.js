// ============================================================
// KNOWLEDGE.JS — Baza de cunoștințe "Ai Alin" (demo offline)
// Mecanică, electrică și diagnoză auto — Audi, BMW, Mercedes.
// Diagnostic ORIENTATIV — NU înlocuiește verificarea cu aparatul.
// ============================================================

var BRAND_TOOLS = {
  audi: "VCDS / OBD11",
  bmw: "ISTA / INPA / Carly",
  mercedes: "XENTRY / DAS / CarSoft",
  alt: "un aparat OBD generic"
};

// ---------- utilitare ----------
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i")
    .replace(/ș/g, "s").replace(/ş/g, "s")
    .replace(/ț/g, "t").replace(/ţ/g, "t")
    .trim();
}

function detectBrand(text) {
  var n = normalize(text);
  if (/(audi|a3|a4|a5|a6|a7|a8|q3|q5|q7|q8|tt|rs3|rs4|rs5|rs6|s3|s4|sq5|golf|passat|golf)/.test(n) || /\bvw\b|\bvag\b|seat|skoda/.test(n)) return "audi";
  if (/(bmw|seria [1-8]|m2|m3|m4|m5|m6|x1|x3|x4|x5|x6|z4|e46|e90|e60|f10|f30|g20|g30|mini)/.test(n)) return "bmw";
  if (/(mercedes|benz|clasa [acegls]|clasa c|clasa e|clasa s|glc|gle|gla|glb|gls|a180|s208|w204|w212|w205|w213|w222)/.test(n)) return "mercedes";
  return "alt";
}

// Detectează familia de motor (determină ghidul specific de marcă)
function detectEngine(text) {
  var n = normalize(text);
  var list = [
    { k: ["2.0 tfsi", "2.0tfsi", "ea888", "tfsi"], b: "audi", name: "Audi 2.0 TFSI / EA888" },
    { k: ["1.8 tsi", "1.8tsi", "1.4 tsi", "1.4tsi", "ea111"], b: "audi", name: "VAG 1.4/1.8 TSI (EA111)" },
    { k: ["1.6 tdi", "1.6tdi", "2.0 tdi", "2.0tdi", "3.0 tdi", "ea189", "ea288", "tdi"], b: "audi", name: "Audi TDI" },
    { k: ["n20", "n26", "n47", "n57", "n63", "n55", "n54", "n52", "n53", "b38", "b48", "b58", "b57", "b37", "m54", "m52"], b: "bmw", name: "motor BMW serie N/B + M54/M52" },
    { k: ["om651", "om642", "om646", "om 651", "om 642", "om611", "om613", "om628"], b: "mercedes", name: "diesel Mercedes OM6xx" },
    { k: ["m271", "m274", "m276", "m278", "m272", "m 271", "m 274"], b: "mercedes", name: "benzină Mercedes M27x" }
  ];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < list[i].k.length; j++) {
      if (n.indexOf(list[i].k[j]) !== -1) return list[i];
    }
  }
  return null;
}

// ---------- Ghiduri pe familii de motor ----------
var ENGINE_GUIDES = [
  {
    k: ["2.0 tfsi", "2.0tfsi", "ea888", "tfsi"],
    a: "Ghid **Audi 2.0 TFSI / EA888** (A4, A5, A6, Q5, VW, Škoda):\n\n" +
       "- **🔧 Lanț/tensioner distribuție pe gen.1 (EA888):** zgomot la rece, semnal de sincronizare — se verifică lanțul dintre țevi și ghidajul din față. Dacă se prelungește, risc de deteriorare motor.\n" +
       "- **🛢️ Consum de ulei:** frecvent prin segmenți / prin distribuție; se verifică cu test de compresie + măsurarea presiunii. Cauze tipice: PCV (blow-by) înfundat.\n" +
       "- **⚙️ Bujii/bobine:** misfire la rece pe cilindru — cod P030x; testezi cu interschimb.\n" +
       "- **❄️ Pompa de apă cu electrovalvă:** scurgeri frecvente pe gen.2/3 — se verifică la revizie.\n" +
       "- **🧪 Pompa de înaltă presiune (HPFP) pe gen.1:** risc de amestec cu ulei — dacă miroși benzină în ulei, NU mai porni motorul, verifică imediat pompa!\n\n" +
       "📋 Verificări recomandate: ulei doar VW 502/504/507 la 15.000 km; bujii la 60.000 km; lanț pe gen.1 la 120–150.000 km; PCV la primul semn."
  },
  {
    k: ["1.4 tsi", "1.4tsi", "1.8tsi", "1.8 tsi", "ea111"],
    a: "Ghid **VAG 1.4 TSI / 1.8 TSI (EA111):**\n\n" +
       "- **🔧 Atenție:** aici distribuția e pe lanț (nu curea). La 1.4 TSI (supercharger + turbo) lanțul superior e notoriu: se întinde și face „zdrângănit” la pornire. Se verifică jocul tensionerului la 80–120 mii km; ideal înlocuire preventivă.\n" +
       "- **⚙️ Răcire:** pompa de apă electrică auxiliară e punctul sensibil — dacă nu mai funcționează sau pierde lichid, se înlocuiește.\n" +
       "- **🛢️ Ulei:** doar VW 502/504; verifică nivelul săptămânal (turbo consumă ulei normal).\n\n" +
       "📋 La primul zgomot de lanț la rece → verificare imediată la service."
  },
  {
    k: ["2.0 tdi", "2.0tdi", "1.6tdi", "tdi", "ea189"],
    a: "Ghid **Audi/VW TDI (1.6 / 2.0 TDI):**\n\n" +
       "- **🧯 DPF (filtru de particule):** martorul aprins = regenerare necesară; se face regenerare forțată cu VCDS. Creșterea presiunii diferențiale peste ~800 mbar = curățare/înlocuire.\n" +
       "- **🚫 Clapeta de turbină (VNT):** depuneri de funingine → zgomot și lipsă de putere; se curăță.\n" +
       "- **🔋 Injectoare piezoelectrice:** defecțiunile dau trepidații la pornire + fum (2.0 TDI 140 CP); se verifică compensarea injectoarelor cu testerul.\n" +
       "- **❄️ Intercooler/conducte turbo:** scurgeri → semn de presiune mică; se verifică conductele și „urechile”.\n" +
       "- **🧪 EGR:** se colmatează — consum mare + regenerări DPF frecvente; se curăță și se verifică cu VCDS.\n\n" +
       "📋 Ulei: VW 507.00 (LongLife) sau 505.01. DPF NU se scoate — ilegal, strică omologarea."
  },
  {
    k: ["n47", "n20", "n26", "n57", "n63", "n55", "n54", "b47", "b48", "b57"],
    a: "Ghid **BMW — lanț de distribuție și sisteme principale:**\n\n" +
       "- **🔧 N47 (diesel 2.0):** lanțul de distribuție e slab — simptome: „zdrăngănit la pornire”, cod sincronizare (P0016-17), „piesă de tensioner cu ghidaj”. Înlocuire preventivă la 150–180.000 km (kit cu pompa de ulei).\n" +
       "- **🔧 N20/N26 (benzină 2.0):** lanț cu ghidaj ce se poate rupe la ~100–140.000 km, indiferent de îngrijire. Zgomot metalic la rece = alarmă roșie.\n" +
       "- **🔗 N63/N62 (V8):** scurgeri de ulei pe la valvetronic/crankcase + consum de ulei prin segmenți; benzinar N63 e cunoscut pentru pierderile de ulei.\n" +
       "- **⚙️ Valvetronic + VANOS:** coduri de eroare pentru sincronizare și vibrații la relanti; se verifică și lanțul de sincronizare.\n" +
       "- **🛢️ PCV / capac de valve (valve cover):** membranele se sparg — scurgeri, fum, vibrații, consum de ulei. La N20/N47 e un defect cunoscut.\n\n" +
       "📋 Ulei: Longlife-01 (benzină) / Longlife-04 (diesel). Interval 10.000 km e mai sigur decât 15.000."
  },
  {
    k: ["om651", "om642", "om646", "om 651", "om 642", "om646"],
    a: "Ghid **Mercedes diesel OM6xx:**\n\n" +
       "- **🔧 OM651 (2.1 d — Clasa C/E, Vito, Sprinter):** cu un shim la 2016 lanțul/sistemul de distribuție e mai fiabil, dar EGR + DPF sunt cerințe; tremur și pierdere de putere după 200.000 km — verifici compresia.\n" +
       "- **🔧 OM642 (V6 3.0 CDI/Bluetec — Vito, ML, GL, GLE):** flanșa de la oil cooler (schimbător ulei/antigel) se fisurează — „maioneză în antigel”. Verificare imediată la martorul de temperatură. Scurgeri de ulei între bloc și chiulasă — clasic.\n" +
       "- **🔧 OM646 (4-cil 2.2):** pompa de înaltă presiune se poate strica și să trimită combustibil în ulei — miros de motorină în ulei = NU mai porni; repara pompa, apoi schimbă uleiul.\n" +
       "- **🧪 AdBlue (Bluetec):** senzori NOx + injector AdBlue; NU folosi adblue de proastă calitate.\n" +
       "- **🛢️ Ulei:** MB 229.51/229.52 (cu DPF), 229.31 (fără DPF). DPF NU se scoate.\n\n" +
       "📋 Verificare anuală: presiune turbo, scurgeri ulei/antigel, starea DPF via XENTRY."
  },
  {
    k: ["m271", "m274", "m276", "m278", "m272", "m 271", "m 274"],
    a: "Ghid **Mercedes benzină M27x/M27x:**\n\n" +
       "- **🔧 M271 (1.8 benzină):** lanțul de distribuție + tensioner sunt puncte slabe — zgomot tipic de „țânțar”, întindere. Se verifică și se înlocuiește până la ~120.000 km. Scurgeri la „crankcase vent valve”.\n" +
       "- **🔧 M272 (V6 3.5) / M273 (V8):** uzura la lanțul arborilor de echilibrare (balancer shaft) e un defect mare — inspectează setul de cilindri și codurile P0016-19.\n" +
       "- **🔧 M276 (V6 3.0/3.5 bi-turbo):** scurgeri de ulei la răcitorul ulei + consum de ulei; lanț pe gen.1 — rezistă ~150 mii km.\n" +
       "- **⚙️ Bujii/bobine:** clasice pe V6.\n\n" +
       "📋 Ulei: MB 229.5 (benzină). La suspiciune de garnituri: test de compresie pe cald."
  }
];

// ---------- Baza de coduri de eroare (DTC) ----------
var DTC_DB = {
  "p0300": "Rata de aprindere aleatorie / multipli cilindri → bujii, bobine, injectoare, presiune combustibil. Verifici pe rând: bujii → bobine (interschimb) → injector → compresie.",
  "p0301": "Misfire cilindrul 1 → schimbă bujia/bobina cu alt cilindru (test de interschimb) ca să localizezi.",
  "p0302": "Misfire cilindrul 2 → vezi P0301.",
  "p0303": "Misfire cilindrul 3 → vezi P0301.",
  "p0304": "Misfire cilindrul 4 → vezi P0301.",
  "p0171": "Amestec sărac (banc 1) → scurgeri de aer în admisie, MAF, senzor O2. Verifici cu valori live STFT/LTFT.",
  "p0172": "Amestec bogat (banc 1) → MAF murdar, presiune combustibil mare, EGR, sonzi O2.",
  "p0113": "Senzor temperatură aer admisie (IAT) — semnal în afara domeniului → senzor, cablaj, mufă.",
  "p0112": "Senzor IAT — semnal scăzut → senzor/cablaj în scurt.",
  "p0420": "Catalizator — eficiență scăzută banc 1 → catalizator obosit SAU sonzi lambda; întâi verifici sonzii.",
  "p0430": "Catalizator — eficiență scăzută banc 2 → vezi P0420.",
  "p0442": "Evaporație — scurgere mică (EVAP) → verifici capacul rezervor, apoi conductele.",
  "p0455": "Evaporație — scurgere mare → capac/conducte rupte.",
  "p0401": "EGR — debit insuficient → EGR colmatat, senzor presiune diferențială, cablaj.",
  "p0299": "Presiune turbo sub limită → scurgere aer intercooler/conducte, actuator VNT, wastegate blocat, senzor MAP. Ține de rubrica turbo.",
  "p0234": "Presiune turbo peste limită (overboost) → wastegate nu deschide, actuator blocat, senzor MAP.",
  "p0016": "Sincronizare crak/cămăși (banc 1) → lanț întins/ghidaj, VANOS, senzor poziție. Pe BMW N47/N20 = alarmă serioasă.",
  "p0017": "Sincronizare crak/cămăși (banc 1, senzor B) → vezi P0016.",
  "p0087": "Presiune rail/rampă scăzută → pompa HP, senzor presiune, filtre, scurgeri combustibil.",
  "p0088": "Presiune rail prea mare → regulator, pompa HP, senzor.",
  "p242f": "DPF — depuneri de cenușă / colmatare → regenerare forțată; dacă e prea mult, curățare/înlocuire.",
  "p2002": "DPF — eficiență scăzută → senzor diferențial, DPF colmatat; se citește diferența de presiune.",
  "p2453": "Senzor presiune diferențială DPF — în afara gama → senzor sau conector.",
  "p2015": "Senzor poziție clapetă (zip) — în afara domeniului → frecvent pe VAG 2.0 TDI; verifică clapeta/vacuum.",
  "p20ee": "SCR/NOx — limita eficienței → sistemul de urea; AdBlue prost, senzori NOx, injector urea.",
  "p0456": "Evaporație — scurgere mică detectată → vezi P0442.",
  "p2119": "Clapeta accelerație — funcționare blocată → clapeta murdară, motoreductor/cablaj.",
  "p2187": "Amestec sărac la ralanti (banc 1) → scurgeri de aer după MAF, EGR.",
  "p2188": "Amestec bogat la ralanti → vezi P0172.",
  "p0458": "EVAP — supapa de purjare → senzor/solenoid.",
  "p20ba": "SCR — compoziție AdBlue → senzor calitate sau injector urea."
};

function detectDTC(text) {
  var n = normalize(text);
  var m = n.match(/\bp[0-9]{4}\b/);
  return m ? m[0] : null;
}

// ---------- Reguli SIMPTOME (diagnostice mai ample) ----------
var KB = [
  {
    k: ["nu porneste", "nu pornește", "nu porneste deloc", "nu vrea sa porneasca", "nici nu cranceaza", "nu intoarce", "nu se intoarce", "tacit la cheie", "clack clack", "baterie descarcata", "baterie moarta", "nu tine incarcarea", "starter", "demaror"],
    a: "Cauze probabile la „nu pornește”, în ordinea frecvenței:\n\n" +
       "1. **Baterie descărcată / borne oxidate** (≈70% din cazuri). Verifici bornele, le cureți cu perie metalică, apoi tensiunea: 12,4V+ fără consum, peste 10V la 2s de demarare.\n" +
       "2. **Demaror / solenoid** — un singur „clac” la cheie poate fi solenoid uzat; roată de demaror blocată pe volant.\n" +
       "3. **Masă slabă / contacte** — verifici masele motor–caroserie.\n" +
       "4. **Imobilizator (EIS/CAS/Kessy)** — dacă cheia nu e citită, martorul cheii/licoare în bord; încerci a doua cheie.\n" +
       "5. **Senzor pedală ambreiaj / poziție cutie P/N** — pe automate nu pornește fără confirmarea poziției.\n\n" +
       "📋 Pași: măsori bateria → încerci booster → dacă pornește, verifici alternatorul + consumul static; dacă nu pornește nici cu booster, verificăm demarorul/imobilizatorul cu testerul mărcii. Cost orientativ: baterie 400–900 lei, demaror 600–1500 lei, terminale 50–150 lei."
  },
  {
    k: ["martor baterie", "martoru de baterie", "nu se incarca", "nu încarcă", "alternator", "se descarca peste noapte", "descarcare", "consum static", "mers la greu", "baterie agm", "agm", "ibs", "gestionare baterie"],
    a: "Probleme de încărcare / descărcare:\n\n" +
       "1. **Alternator / regulator** — cu motorul pornit la relanti și apoi 2000 rpm trebuie vezi 13,8–14,4V la borne. Sub 13V = nu încarcă. Verifici și cureaua accesorii (patinare/ruptă).\n" +
       "2. **Consum static (de repaus)** — măsoară cu ampermetru în serie pe borna minus, mașina închisă și „adormită” 20 min. Normal: sub 40–50mA. Cauze: radio, modul confort/tavan, fals contact modul portbagaj.\n" +
       "3. **Baterie îmbătrânită** — test de sarcină (CCA). Bateriile moderne au **gestionare (AGM/IBS)** — la BMW/Mercedes noua baterie trebuie **înregistrată în module** (ISTA/XENTRY), altfel încărcarea rămâne greșită.\n" +
       "4. **Mase slabe** — lumini pâlpâie, senzori „nebuni”: verifici masele de la motor, baterie, caroserie.\n\n" +
       "Cost orientativ: alternator 800–1800 lei, regulator 150–400 lei, baterie (AGM) 500–950 lei, înregistrare baterie 100–250 lei. ⚠️ Pe start-stop NU montezi orice baterie — doar EFB/AGM ca din carte!"
  },
  {
    k: ["martor ulei", "martoru de ulei", "presiune ulei", "nivel ulei", "bec ulei", "lampa ulei", "alerta ulei"],
    a: "Martorul de ulei NU se ignoră niciodată. ⚠️\n\n" +
       "Dacă e **roșu și clipește la turație / în viraje** → oprește imediat motorul, pune mașina în punct, verifică nivelul cu joja.\n\n" +
       "Cauze, în ordine:\n\n" +
       "1. **Nivel ulei scăzut** — cel mai frecvent. Verifici la rece, pe teren drept.\n" +
       "2. **Senzor de presiune (switch) defect** — alarme intermitente false; se verifică cu manometru.\n" +
       "3. **Pompa de ulei uzată / plasă colmatată** — presiune reală mică, mai ales la turații mari; posibil zgomot „clinchet”.\n" +
       "4. **Ulei greșit/vechi** — vâscozitate sau normă incorectă (BMW: Longlife, MB: 229.x, VW: 502/507; nu improviza).\n" +
       "5. **PCV / capac de valve (BMW)** — membranele trase de aer dau presiune mică.\n\n" +
       "📋 Verificare: nivel → presiune cu manometru fizic → compare cu valorile din carte. Sub minim → pompa de ulei. Cost: senzor 50–250 lei, pompă de ulei 700–2500 lei, PCV 200–600 lei. ⚠️ Pe 2.0 TFSI/TSI presiunea mică repetată poate însemna sedimente / uzură de segmenți."
  },
  {
    k: ["martor motor", "check engine", "check-engine", "martoru de motor", "bec motor", "lampa motor", "motor in regim", "motor de rezerva"],
    a: "Martorul **check engine** = există coduri de eroare. Fără citire, doar ghicim — deci:\n\n" +
       "**Primul pas:** citește codul cu " + "{T}" + " (sau orice OBD-II). Scrie-mi codul exact și-ți dau planul.\n\n" +
       "Cauzele cele mai frecvente:\n\n" +
       "1. **Sonzi lambda (O2)** — amestec strâmb; coduri P0030–P0175.\n" +
       "2. **Bujii / bobine** — misfire P030x; testezi cu interschimb.\n" +
       "3. **Scurgeri de aer în admisie** — relanti neregulat „tresăie”, cod de amestec (P0171).\n" +
       "4. **EGR / DPF / AdBlue (diesel)** — regenerare, presiune diferențială.\n" +
       "5. **Senzori sincronizare Crank-Cam** — P0016 etc.\n\n" +
       "Dacă motorul intră în **„mod de rezervă” (limp mode)** — poți continua scurt până la service, dar NU forțezi. Dacă e imposibil de condus / zgomot anormal, nu mai porni motorul."
  },
  {
    k: ["supraincalzire", "supraîncalzire", "temperatura mare", "temperatura urca", "ti duce apa", "fierbe", "lichid de racire", "antigel scade", "pierde antigel", "garnitura de chiulasa", "garnitura chiulasa", "maioneza", "maioneză", "racire motor"],
    a: "Supraîncălzirea e urgentă: dacă acul trece de ~100°C sau s-a aprins martorul roșu, **oprește motorul** și lasă-l să se răcească.\n\n" +
       "Cauze probabile:\n\n" +
       "1. **Nivel scăzut / aer în sistem** — verifici rezervorul la rece, iar antigelul e pe la marcaj; aerisești.\n" +
       "2. **Termostat blocat închis** — motorul nu urcă în temperatura de funcționare; debit mic de lichid.\n" +
       "3. **Pompa de apă** — joc, paleți corodați (pe 2.0 TSI/TFSI și MB M271/M274 e clasic).\n" +
       "4. **Electroventilator / termostat de radiator** — nu pornește: verifici siguranța, releul, senzorul.\n" +
       "5. **Radiator colmatat** (muște/praf) sau ventilator cu rulment blocat.\n" +
       "6. **⚠️ Garnitura chiulasa** — „maioneză” sub capacul de ulei, gaz în rezervor (antigel „bușnește”), fum alb, nivel antigel scade fără scurgere → NU mai porni motorul; reparație mare.\n\n" +
       "Cost orientativ: termostat 150–400 lei, pompă apă 600–1500 lei, electroventilator 400–900 lei, garnitură chiulasa 2000–5000 lei."
  },
  {
    k: ["zgomot", "zgomot motor", "zgomote", "tacane motor", "tacane", "clinchet", "zgomot la motor", "tac tari", "zgomot de tacheti", "tacheti", "vanzos", "valvetronic", "zgomot la rece"],
    a: "Zgomotele de motor sunt „spionul” tău:\n\n" +
       "1. **Zgomot metalic lângă distribuție, la rece** → lanț de distribuție întins (ghidaj/tensioner), pe **N20/N47 BMW, 2.0 TFSI gen.1 (EA888)**: „zdrăngănit de lanț”. NU amâni — lanț rupt = motor distrus.\n" +
       "2. **Trosnet/tacane la rece, dispare în 10–30s** → tacheți hidraulici goliți de ulei sau presiune mică la pornire (mai ales BMW cu Valvetronic). Verifici nivelul + presiunea uleiului.\n" +
       "3. **Clinchet ritmic, care crește cu turația, din partea blocului** → uzură bielă/fus — NU se amână, e motor de recondiționat.\n" +
       "4. **Ticăit regulat „țânțar” la MB M271/M274** → lanț/tensioner — verifică imediat.\n" +
       "5. **Fluierat/turbină la accelerare** → vezi rubrica turbo.\n\n" +
       "📋 Recomandare: dacă zgomotul apare la rece sau în ture mari, NU face drum lung. Verifică la service cu stetoscop mecanic; pe BMW ISTA dă codul și răspunsul lanțului."
  },
  {
    k: ["fum negru", "fum alb", "fum albastru", "fumeaza", "fumegaza", "fum de esapament", "esapament fum", "consuma ulei", "consum de ulei", "pierde ulei", "scade uleiul", "amestec bogat", "emisiile"],
    a: "Culoarea fumului = diagnostic rapid:\n\n" +
       "🟤 **Fum negru** (amestec bogat): MAF murdar, sonzi lambda, injectoare cu scurgeri, filtru de aer colmatat, presiune rail mare. La diesel: injectoare uzate sau EGR blocat.\n\n" +
       "⚪ **Fum alb după ce motorul s-a încălzit** (continuu, miros dulce) = lichid de răcire ars → garnitură chiulasa / chiulasa. Dacă e doar vapori la rece, e normal.\n\n" +
       "🔵 **Fum albastru** = ulei ars: la turație mare după frână de motor → simeringuri/ghidaje de supape; la turație constantă → segmenți; la frână de motor → turbina suflă ulei.\n\n" +
       "📋 Verificări: compresie pe cald, test de pierderi (leak-down), joc turbină, analiza uleiului. Costuri: injectoare 300–900 lei/buc, turbină 2000–5000 lei, segmenți 5–9 mii lei, garnitură chiulasa 2–5 mii lei."
  },
  {
    k: ["vibratii la franare", "tremura volanul la frana", "frana vibreaza", "vibreaza la franare", "discuri de frana", "placute de frana", "scartai la frinare", "frana trancane", "frana nu e normala"],
    a: "Vibrații la frânare (în volan sau pedală):\n\n" +
       "1. **Discuri ovalizate / deformate** — cea mai frecventă cauză. Se măsoară cu comparator; se rectifică sau se înlocuiește perechea.\n" +
       "2. **Plăcuțe uzate / ghidaje etrier** — plăcuțe prinse, etrier blocat: roata se încinge, trage într-o parte.\n" +
       "3. **Jocuri rulmenți / direcție** — amplifică imperfecțiunile discurilor.\n" +
       "4. **Pe BMW/Mercedes** — alarmă de uzură a plăcuțelor (senzor) dacă sunt la ~2 mm.\n\n" +
       "📋 Cost: discuri 250–600 lei/buc (per marcă), plăcuțe 150–350 lei/set, manoperă 150–300/ax. Rodaj 200–300 km fără frânări bruște. ⚠️ Dacă frânele se încing și miroase a ars — etrier blocat, mergi direct la service."
  },
  {
    k: ["martor abs", "martoru abs", "lampa abs", "abs se aprinde", "senzor abs", "abs blocat", "abs defect"],
    a: "Martor ABS aprins = ABS/ESP dezactivat (frânează normal, dar fără asist electronic).\n\n" +
       "Cauze:\n\n" +
       "1. **Senzor de roată ABS** (murdar/defect/rupt cablu) — cel mai comun; verifici și inelul reluctor din butuc.\n" +
       "2. **Cablaj senzor rupt** la suspensie — foarte frecvent pe mașini mai vechi.\n" +
       "3. **Modul ABS / DSC** (electronic sau hidraulic) — la Mercedes e clasic în zona modulului de frână (tobe de cabluri), la BMW unitățile DSC.\n" +
       "4. **Tensiune baterie scăzută** — da alarme false temporare.\n\n" +
       "📋 Citește codul pe modulul ABS cu " + "{T}" + ". Scrie-mi codul → îți spun pe ce axă e. Cost orientativ: senzor ABS 100–350 lei, modul ABS 1500–4000 lei."
  },
  {
    k: ["martor esp", "martoru esp", "airbag", "martor airbag", "lampa airbag", "martor senzor", "presiune pneuri", "tpms", "senzor unghi volan"],
    a: "Alarme de siguranță:\n\n" +
       "- **AIRBAG aprins** — sistem de siguranță oprit. Cauze frecvente: conector sub scaun (deconectat la mutarea scaunului), spirala volanului, senzor de șoc. Se citește cu " + "{T}" + "; NU se resetează „pe ochi”.\n" +
       "- **ESP / ABS** — poate fi senzorul de unghi volan de calibrat după lucrări de geometrie/direcție; sau senzor de roată.\n" +
       "- **TPMS (presiune pneuri)** — umfli la valoarea din plăcuța de pe portieră (2,2–2,5 bar) și resetezi din bord. Dacă revine des, e senzor în vală sau scurgere lentă.\n\n" +
       "📋 Întotdeauna citești codul. Senzorul de unghi volan se mai repară pe banc; airbag → neapărat service autorizat."
  },
  {
    k: ["aer conditionat nu raceste", "aer conditionat", "ac nu raceste", "climatizare nu raceste", "gaz ac", "agent rece", "compresor ac", "ac sufla cald", "racire aer", "ac functional"],
    a: "AC nu mai răcește — cauze în ordine:\n\n" +
       "1. **Agent frigorific scăzut / lipsă** (≈80% cazuri) — verifici presiunile cu manifold; reîncărcare + test etanșeitate (dacă lipsește complet, e o scurgere de căutat și reparată, nu doar reumplută!).\n" +
       "2. **Compresor nu cuplează** — siguranța, releul, presostat, ambreiaj electromagnetic sau clapetă de comandă (pe multe BMW/Audi).\n" +
       "3. **Condensator (radiator AC) perforat/înfundat** — se schimbă.\n" +
       "4. **Senzor de temperatură / electronică de climatizare** — intră cu " + "{T}" + " în modulul HVAC.\n\n" +
       "Cost orientativ: încărcare + reparație scurgere 250–600 lei, compresor 1200–3000 lei, condensator 400–1200 lei. ⚙️ Ține AC-ul pornit 15 min/lună și iarna — compresorul trăiește mai mult."
  },
  {
    k: ["suspensie", "zgomot suspensie", "tremura volanul la viteza", "tremura volan", "volanul tremura", "tremurat", "vibratii la viteza", "vibreaza", "vibraza", "vibratii in volan", "buse", "bucse", "capete de bara", "capete biela", "amortizoare", "geometrie", "dezechilibrare roti", "echilibrare", "airmatic", "pasm", "adaptive"],
    a: "Tren de rulare / suspensie:\n\n" +
       "1. **Tremurat în volan la ~80–120 km/h** (nu la frânare) → roți dezechilibrate / distorsionate / jantă îndoită. Se echilibrează.\n" +
       "2. **Tremurat la frânare** → discuri ovalizate (vezi rubrica frâne).\n" +
       "3. **„Toc-protoc” pe denivelări** → bucșe brațe, capete de bară, bielete anti-ruliu cu joc.\n" +
       "4. **Mașina trage într-o parte** → geometrie, presiuni, uzură asimetrică.\n" +
       "5. **Suspensii pneumatice (Airmatic Mercedes, adaptive BMW, pneumatice VAG)** — mașina se lasă peste noapte: aer la amortizor, compresor, senzor de înălțime, supapă de nivel. Se verifică cu tester + scanare scurgeri.\n\n" +
       "📋 Cost: echilibrare 40–80 lei, set bucșe braț 200–600 lei, capete de bară 80–250 lei, amortizoare (pereche) 800–2000 lei, geometrie 150–300 lei. După lucrări la direcție se recalibrează senzorul unghi volan. Airmatic: amortizor 1500–4000 lei, compresor 1200–2500 lei."
  },
  {
    k: ["cutie de viteze", "cutie automata", "s tronic", "dsg", "steptronic", "nu schimba", "nu cupleaza", "ambreiaj", "ambreiajul aluneca", "patina ambreiaj", "miros de ambreiaj", "cutia sacadeaza", "mecatronica", "zf", "7g", "7g tronic", "dct", "cutie manuala"],
    a: "Transmisie — semne și ce verifici:\n\n" +
       "1. **Ambreiaj (manual):** turația urcă în gol dar mașina nu merge → se înlocuiește discul + presa + volant dublu-masă dacă are joc. Miros de ars = semn clar. Cost 1000–2600 lei kit.\n" +
       "2. **Cutii automate (DSG/S tronic, ZF 8HP, 7G/9G tronic, DCT):** întârzieri, sacadează, nu vrea treapta → întâi **uleiul + filtrele de cutie** (conform carte: ZF LifeGuard, VW G052, MB ATF). Schimbat prea târziu = mecatronică uzată (DSG 2000–7000 lei).\n" +
       "3. **„Nu cuplează înainte/înapoi”** — presiune/scripeți, solenoizi; la DSG ambreiajele pot fi uscate/uzate.\n" +
       "4. **Cutia „se încălzește”** dacă automată duce prea mult — radiatoare de cutie colmatate.\n\n" +
       "📋 Reguli: automată nu se ține „în rulare” la frână de motor (se strică planetarele), nivelul se verifică pe cald, uleiul doar cu specificația cărții. Cost: ulei+filtru automată 500–1200 lei, mecatronică 3000–7000 lei, reparație cutie 6–15 mii lei."
  },
  {
    k: ["consum mare", "consuma mult", "consum de combustibil", "consuma benzina", "consuma motorina", "consum excesiv", "cost consum"],
    a: "Consum mai mare decât de obicei — checklist:\n\n" +
       "🛞 Presiune pneuri corectă (valoare din plăcuța de pe portieră!), frâne care „trag” (roată caldă), stil agresiv/trafic.\n\n" +
       "⚙️ Motor: **sonzi lambda** degradați (amestec greșit), **MAF murdar** (consum + putere), bujii/bobine uzate, **filtru de aer colmatat**, termostat care nu aduce temperatura de regim.\n\n" +
       "🔧 Diesel: **EGR blocat deschis**, injectoare cu debit greșit, **DPF în regenerare prea des** (consum + ulei + cordon).\n" +
       "📡 Rulare: rulment de roată defect (consum + zgomot), geometrie greșită.\n\n" +
       "📋 Verifici gratuit: pneurile + roțile calde după un drum. Apoi citești codurile + valorile live (STFT/LTFT) cu " + "{T}" + ". O mașină întreținută are consum stabil; variații >10% = ceva e în neregulă."
  },
  {
    k: ["turbina", "fluiera", "fluierat", "suierat", "turbina fluiera", "presiune turbo", "booster", "nu trage", "nu are putere", "nu mai trage", "turbo facut", "wastegate", "actuator", "vgt", "vnt"],
    a: "Probleme turbo / presiune:\n\n" +
       "1. **Fluierat + pierdere putere** → aer scapă (intercooler, conducte, garnituri). Caută cu „smoke machine” / fum de test.\n" +
       "2. **Fluierat + fum albastru la frână de motor** → ulei în turbină: simering amortizor, joacă axială. Recondiționare sau înlocuire.\n" +
       "3. **„Nu trage”** → coduri boost: verifici valorile comandate vs reale cu " + "{T}" + "; actuator/wastegate blocat sau linia de vacuum.\n" +
       "4. **Pe diesel:** geometrie variabilă (VNT) blocată din funingine — zgomot, lipsă putere, martor DPF.\n\n" +
       "Cost: recondiționare 1500–3500 lei, turbo nou 3000–7000 lei, intercooler 600–2000 lei. ⚠️ Turbo defect → curăță intercooler/conducte imediat sau poți strica și motorul."
  },
  {
    k: ["filtru de particule", "dpf", "regenerare", "adblue", "urea", "scr", "martor dpf", "dpf colmatat"],
    a: "DPF / AdBlue — sisteme de emisii pe diesel:\n\n" +
       "🟠 **Martor DPF aprins** → regenerare necesară: mergi 20–30 min la turație peste 2000 rpm (autostradă), NU ciclu scurt. Dacă se repetă des → cauze primare: EGR, injectoare cu scurgeri, senzor diferențial.\n" +
       "🟢 Dacă regenerările sunt prea dese: se verifică **presiunea diferențială** (cu XENTRY/ISTA/VCDS) — colmatare ireversibilă = curățare profesională sau înlocuire.\n" +
       "🔵 **AdBlue (SCR/urea)** — de proastă calitate strică senzorii NOx și cristalizează; iarna poate îngheța (normal, sistemul se încălzește). Dacă rezervorul rămâne gol, mașina avertizează cu 1000–1500 km înainte, apoi motorul intră în mod limitat sau nu mai pornește.\n\n" +
       "📋 Reguli: DPF NU se scoate (ilegal, strică omologarea); AdBlue doar certificat; regenerare forțată doar cu testerul mărcii. Cost curățare DPF 600–1500 lei, DPF nou 3000–9000 lei, senzor NOx 800–2500 lei."
  },
  {
    k: ["cheie", "cheie nu", "cheia", "cheia mea", "cheia nu", "nu deschide", "imobilizator", "kessy", "keyless", "cheia nu merge", "cheie nu deschide", "buton pornire", "elesys", "directie blocata", "steering lock"],
    a: "Probleme de cheie / pornire modernă:\n\n" +
       "1. **Cheia nu deschide** — bateria de cheie: se înlocuiește (CR2032) și uneori se reînvață la mașină. Dacă LED-ul nu clipește la apăsare → semi-definită cheia.\n" +
       "2. **Nu pornește, dar bordul „trăiește”** — sistemul imobilizator (EIS la MB, CAS la BMW, Kessy la VAG): cheie nerecunoscută sau contact de uz. Verifici a doua cheie și senzorii.\n" +
       "3. **Steering lock / Elesys (BMW)** — „direcție blocată” la pornire: unitatea steering lock e o problemă cunoscută; se citește cu ISTA.\n" +
       "4. **După înlocuirea bateriei** — unele module pot cere resincronizarea; altfel se învață cu testerul mărcii.\n\n" +
       "📋 Cost: baterie cheie 20–60 lei, învățare cheie 200–600 lei, modul EIS/CAS/Kessy 1500–5000 lei. ⚠️ Păstrează cheia de rezervă programată — altfel costul crește."
  },
  {
    k: ["geam", "geam electric", "geamul", "geamul electric", "geamurile", "geamuri", "geamul nu urca", "nu urca", "geamuri electrice", "panou geam"],
    a: "Geamuri electrice / accesorii:\n\n" +
       "1. **Geamul coboară dar nu urcă / invers** — mecanismul sau motorul geamului; pe multe modele problema e la „regleta” (cablu).\n" +
       "2. **Mers pe 1–2 cm apoi pauză** — frecvent la Mercedes/BMW: cablajul din burduful portierei se rupe; verifici cu voltmetru.\n" +
       "3. **Butoanele nu fac nimic** — siguranța sau modulul de portieră.\n" +
       "4. **Geamul „alunecă” din ghidaje** — se ajustează ghidajele.\n\n" +
       "📋 Nu forța geamul ridicând mecanismul blocat (rup cablul). Cost mecanic 100–300 lei; electric 150–450 lei."
  },
  {
    k: ["nu sufla cald", "incalzirea nu merge", "ventilatia nu sufla cald", "automata climatize nu sufla cald", "circulatia lichid nu sufla cald", "aer cald nu", "heater core"],
    a: "Mașina nu suflă cald:\n\n" +
       "1. **Nivel lichid de răcire scăzut / aer în sistemul de încălzire** — verifici rezervorul și aerisești (multe modele au șurub de aerisire).\n" +
       "2. **Termostat prea devreme deschis** — motorul merge rece, ventilatorul interior trimite aer rece.\n" +
       "3. **Clapetele (flaps) din unitatea HVAC** se rup/blochează — la BMW și VAG e frecvent; se aud „clic-clic” sau nu se schimbă poziția; se verifică erorile.\n" +
       "4. **Pompa de apă auxiliară (încălzire)** — pe diesel/moderne e electrică; dacă nu pornește, nu ai debit.\n" +
       "5. **Radiatorul de încălzire colmatat** (heater core) — se spală/fluxează sau se înlocuiește.\n\n" +
       "📋 Din bord: verifici dacă clapeta schimbă aerul către încălzire; dacă da, cauza e debitul de lichid. Cost: termostat 150–400 lei, flaps 300–900 lei, radiator încălzire 300–800 lei."
  },
  {
    k: ["volant dublu masa", "volanta dubla masa", "volanta dublu masa", "volant bimasa", "flywheel", "dublu masa", "dubla masa", "zgomot cutie manuala", "trepidatii la ambreiaj"],
    a: "Volant dublu-masă (DMF):\n\n" +
       "1. **Zgomot „troncănet” la relanti cu ambreiajul cuplat, care dispare la cuplare** → volantul are joc. Frecevent la BMW/VAG/MB după 150–250 mii km.\n" +
       "2. **Vibrații la pornire/oprire, clicuri la schimbarea treptelor** — jocul interior s-a mărit.\n" +
       "3. **Ambreiaj nou montat dar zgomotul rămâne** → volantul n-a fost schimbat (greșeală clasică).\n\n" +
       "📋 Regula: la kit de ambreiaj se montează și volantul (sau se verifică cu comparator). Cost: volant 1200–3000 lei, kit ambreiaj 1000–2600 lei, manoperă 700–1500 lei."
  },
  {
    k: ["rulment roata", "rulmentul de roata", "zgomot la rulare", "vui", "vuvai", "sunetul de rulment", "bearings"],
    a: "Rulment de roată defect:\n\n" +
       "1. **Zgomot „vui” care crește cu viteza** și se schimbă în viraj (la stânga se aude mai tare pe dreapta și invers). Ușor de localizat: încarci roata în viraje.\n" +
       "2. **Joc vertical/horizontal** — ridică mașina, prinde roata la orele 9–3 și 12–6.\n" +
       "3. **Atenție la capete de bară** — aceleași simptome uneori; se distinge prin joc vertical.\n" +
       "4. **Rulment cu senzor ABS**: dacă semnalul e degradat, martor ABS (verifici cu tester care roată).\n\n" +
       "📋 Nu conduce mult cu rulment defect — poate bloca roata. Cost: rulment 120–400 lei/buc, manoperă 200–450 lei/roată."
  },
  {
    k: ["ulei negru", "ulei vechi", "schimb ulei", "ce ulei", "ulei recomandat", "cat ulei", "interval schimb ulei", "ulei la revizie", "care ulei", "norma de ulei"],
    a: "Reguli de aur — ulei (Audi/BMW/Mercedes):\n\n" +
       "- **Strict spec de la carte** (norma, nu „cât e de scump”):\n" +
       "  • Audi/VW: 502/504 (benzină), 507 (diesel)\n" +
       "  • BMW: Longlife-01 (benzină), Longlife-04 (diesel)\n" +
       "  • Mercedes: 229.5 (benzină), 229.51/229.52 (diesel cu DPF)\n" +
       "- **Interval:** 10–15 mii km sau 1 an (în oraș — mai des). Un ulei întreținut prost scurtează viața lanțului de distribuție.\n" +
       "- Nivelul: la rece, pe teren drept; verifică-l săptămânal.\n" +
       "- Schimbă și filtrul de ulei; verifică garniturile (la BMW „oil filter housing gasket” e scurgere clasică — picură pe alternator!).\n\n" +
       "Cost orientativ revizie (ulei premium + filtru + manoperă): benzină 250–600 lei, diesel 300–700 lei."
  },
  {
    k: ["codul p0", "cod p0", "codul p1", "cod p2", "p0300", "p0301", "p0302", "p0303", "p0304", "p0113", "p0171", "p0172", "p0420", "p0442", "p0455", "p0401", "p0299", "p0234", "p0016", "p0017", "p0087", "p0088", "p242f", "p2002", "p2453", "p2015", "p20ee", "p0456", "p2119", "p2187", "p2188", "p0458", "p20ba"],
    a: "Te ajut cu coduri de eroare — întâi citește codul exact (P###), apoi:\n\n" +
       "- **P0300–P0304 (misfire)** → întâi bujia și bobina cilindrului (interschimb cu alt cilindru), apoi injector, apoi compresie.\n" +
       "- **P0171/P0172 (amestec sărac/bogat)** → căutări de scurgeri aer în admisie (P0171) SAU verificarea MAF + presiune combustibil + EGR (P0172).\n" +
       "- **P0420/P0430 (catalizator)** → verifică mai întâi sonzii lambda (date live), nu catalizatorul.\n" +
       "- **P0442/P0455 (evaporație)** → începe cu capacul rezervor, apoi conducte (test la fum).\n" +
       "- **P0299 (boost sub limită)** → scurgeri aer/intercooler, actuator VNT. Vezi rubrica turbo.\n" +
       "- **P0016 (sincronizare)** → lanț întins / VANOS / senzori — pe BMW N47/N20 alarmă serioasă.\n" +
       "- **P0087 (presiune rail scăzută)** → pompă HP, senzor presiune, filtrul combustibil.\n" +
       "- **P242F/P2002 (DPF)** → regenerare forțată apoi citirea presiunii diferențiale. Vezi rubrica DPF.\n\n" +
       "📋 Trimite-mi codul exact + marca/modelul și-ți dau pașii punctuali. Nu schimba piese fără să citești valorile live!"
  }
];

// ---------- Mica politeță ----------
var SMALL_TALK = [
  { k: ["buna", "salut", "salutare", "hello", "hi ", "bună", "bun ziua", "servus", "neata"], a: "Salut! Sunt Ai Alin 🔧 — spune-mi ce face mașina: simptome, coduri de eroare sau ce lucrare vrei să programezi." },
  { k: ["multumesc", "mersi", "merci", "ms", "thank"], a: "Cu drag! Să ai drum bun. Dacă mai apare ceva, sunt aici. 🚗" },
  { k: ["cod"], a: "Spune-mi codul exact (ex. P0301, P0299, P0016) și marca/modelul, și-ți spun ce verificăm pas cu pas." },
  { k: ["pret", "cat costa", "cost"], a: "Îmi trebuie marca, modelul, anul și problema exactă — și îți dau o estimare orientativă. Spune-mi și în ce zonă (motor/suspensie/frâne)." },
  { k: ["program", "unde va", "adresa", "contact", "deschis"], a: "Ne găsești la Strada Atelierului nr. 12, București. Luni–Vineri 08:00–18:00. Aici, în chat, sunt disponibil non-stop. 😄" },
  { k: ["intretinere", "revizie", "check-up", "verificare completa"], a: "Programul standard de revizie (Audi/BMW/Mercedes): ulei + filtre la 10–15 mii km; bujii la 60 mii; filtre de aer/cabină la 30 mii; lichid de frână la 2 ani; antigel la 4–5 ani; curea/lanț + pompa de apă la intervalele din manual; geometrie anuală. Vrei detaliu pe marca ta?" },
  { k: ["bmw"], a: "Pe BMW accentuez: ISTA/INPA pentru coduri, lanț de distribuție la N47/N20 (vezi ghidul motor!), PCV la capacity valve, ulei Longlife. Spune-mi motorul (ex. 320d N47 sau 330i N52) și simptomele." }
];

// ---------- Alege cea mai bună regulă ----------
function scoreRule(rule, n) {
  var score = 0;
  for (var i = 0; i < rule.k.length; i++) {
    if (n.indexOf(normalize(rule.k[i])) !== -1) score += rule.k[i].length;
  }
  return score;
}

function matchKB(text) {
  var n = normalize(text);
  var best = null, bs = 0;
  for (var i = 0; i < KB.length; i++) {
    var s = scoreRule(KB[i], n);
    if (s > bs) { bs = s; best = KB[i]; }
  }
  return bs >= 3 ? best : null;
}

function findSmallTalk(text) {
  var n = normalize(text);
  for (var i = 0; i < SMALL_TALK.length; i++) {
    for (var j = 0; j < SMALL_TALK[i].k.length; j++) {
      var kw = normalize(SMALL_TALK[i].k[j]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var re = new RegExp("(^|[^a-z0-9])" + kw + "($|[^a-z0-9])");
      if (re.test(n)) return SMALL_TALK[i].a;
    }
  }
  return null;
}

function brandPrompt() {
  return "\n\nPentru un diagnostic mai exact, spune-mi: **marca**, **modelul**, **anul**, **motorul** (ex. „Audi A4 2.0 TFSI 2015”) și, dacă ai, **codul de eroare**.";
}

function engineMatches(rule, n) {
  for (var i = 0; i < rule.k.length; i++) {
    if (n.indexOf(rule.k[i]) !== -1) return true;
  }
  return false;
}

// ---------- Răspuns final ----------
function getAnswer(text) {
  if (!text || !normalize(text)) return "Hai să începem — descrie ce problemă are mașina. 😊";

  var n = normalize(text);
  var brand = detectBrand(text);
  var tool = BRAND_TOOLS[brand] || BRAND_TOOLS.alt;
  var answers = [];
  var extra = [];

  // 1. Cod DTC exact — prioritate maximă
  var code = detectDTC(text);
  if (code && DTC_DB[code]) {
    answers.push("🔢 Codul **" + code.toUpperCase() + "**:\n" + DTC_DB[code]);
    extra.push("\n📋 Ți-am dat interpretarea generală. Pentru planul exact pe mașina ta (marca/model/an/motor), spune-mi-le.");
  }

  // 2. Ghid specific de motor
  if (detectEngine(text)) {
    for (var e = 0; e < ENGINE_GUIDES.length; e++) {
      if (engineMatches(ENGINE_GUIDES[e], n)) {
        answers.push(ENGINE_GUIDES[e].a);
        break;
      }
    }
  }

  // 3. Regula de simptome
  var hit = matchKB(text);
  if (hit) {
    var a = hit.a.replace(/\{T\}/g, tool);
    if (brand !== "alt") a += "\n\n🚗 Marca detectată: **" + brand.toUpperCase() + "** — folosesc " + tool + ".";
    answers.push(a);
    for (var i = 0; i < KB.length; i++) {
      if (KB[i] !== hit && scoreRule(KB[i], n) >= 3) extra.push("ℹ️ Vezi și la: " + KB[i].k[0]);
    }
  }

  // 4. Mică politețe
  var st = findSmallTalk(text);
  if (st) answers.push(st);

  if (answers.length) return answers.join("\n\n") + (extra.length ? "\n\n" + extra.join("\n") : "");

  // 5. Fallback
  return "Nu sunt 100% sigur doar din: „" + text + "”. Hai să luăm pas cu pas:\n\n" +
         "1. Descrie **simptomul** (când: la rece/cald, la accelerație/frânare, la turații mari? de când?).\n" +
         "2. Spune-mi **marca, modelul, anul, motorul**.\n" +
         "3. Dacă ai **cod de eroare** (P###), scrie-l aici.\n" +
         "Așa îți dau diagnosticul corect și prețul orientativ." +
         brandPrompt();
}