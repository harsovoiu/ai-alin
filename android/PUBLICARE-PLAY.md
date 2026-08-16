# Publicare pe Google Play — Ghid pas cu pas

## Ce ai deja
| Element | Locație |
|---|---|
| AAB (necesar pentru Google Play) | `C:\Users\Xentry\Desktop\taxi\Ai Alin\AiAlin.aab` |
| APK (instalare directă pe telefon) | `AiAlin.apk` / de pe site |
| Keystore de semnare (SECRET — păstrează-l!) | `android\ai-alin.keystore` |
| Pachet aplicație | `ro.aialin.app` |
| Versiune | 1.0 (versionCode 1) |

> ⚠️ **Keystore-ul nu se pierde și nu se dă nimănui.** Toate actualizările viitoare trebuie semnate cu același fișier și aceleași parole (vezi `android\keystore.properties` — fișier local „secret", nu se publică pe GitHub). Dacă-l pierzi, nu vei mai putea actualiza aplicația.

## Condiții înainte să începi
- Cont **Gmail** (ești tu).
- Cont de dezvoltator **Google Play Console** — se face la https://play.google.com/console cu o taxă unică de **25 $** și verificare de identitate. Această parte trebuie făcută de tine (pei cu cardul tău); nu pot încărca eu în numele tău.

## Pași în Play Console
1. **Creează cont de dezvoltator** → achiziție 25 $ → confirmare e-mail + verificare date.
2. Apasă **„Creează aplicație"**: nume „Ai Alin — Service Auto", limbă „română — ro", „joc: nu", „gratuită: da".
3. În stânga, tabul **„Configurare → Date despre aplicație"**: completezi declarația de date personale și formularul de securitate (aplicația nu colectează date personale).
4. Tab **„Creare release"** (începi cu „Test intern" sau „Test închis") → creezi release → **încarcă `AiAlin.aab`** → salvezi și revizuiți.
5. Tab **„Fișă magazin"** → completezi textul de mai jos + grafice.
6. Tab **„Rating de conținut"** → răspunsuri la întrebări (Rating scăzut — conținut informativ).
7. **„Ținte public"** și **„Politică de confidențialitate"** → pune un URL (ex. poți face o pagină pe site).
8. **„Trimite la revizuire"**. Revizuirea durează de la câteva ore la câteva zile.

## Text de prezentare (copiază-l în Fișă magazin)

**Titlu (30 caractere):**
```
Ai Alin — Service Auto
```

**Descriere scurtă (80 caractere):**
```
Expert mecanic, electrician și diagnoză auto: Audi, BMW, Mercedes.
```

**Descriere completă:**
```
„Ai Alin — Service Auto" este asistentul tău auto din România, cu peste 20 de ani de experiență în mecanică, electrică și diagnoză pentru Audi, BMW și Mercedes.

💰 Ce faci cu aplicația:
• Pui întrebări despre simptome, zgomote sau martori aprinși — primești răspunsuri imediate de la expertul AI auto, în română.
• Înțelegi codurile de eroare (DTC) și ce înseamnă pentru mașina ta.
• Afli pas cu pas ce trebuie verificat și costuri orientative în lei.
• Vezi normele de ulei recomandate pentru motorul tău (TFSI/TDI, BMW N/B, Mercedes OM/M).
• Contactezi service-ul direct: telefon, WhatsApp sau e-mail.

Specializări: Audi / VW (VCDS, OBD11) | BMW (ISTA, INPA) | Mercedes (XENTRY, DAS)

📞 Aleea 2 Călușari nr. 16, Craiova, Dolj | 0785 144 503 | alinservicetld@gmail.com

Diagnoza oferită este orientativă și nu înlocuiește verificarea fizică cu aparatul de diagnoză.
```

**Grafice obligatorii (folderul `Magazin/`):**
- Pictogramă 512×512 → `Magazin/icon_512.png`
- Pictogramă funcțională 512×512 → tot `Magazin/icon_512.png`
- Capturi de ecran telefon (2 buc, 1080×1920) → `Magazin/screenshot_telefon_home.png` și `Magazin/screenshot_telefon_chat.png`
- Imagine de prezentare (feature) 1024×500 → `Magazin/feature_graphic.png`

Dacă vrei să refaci capturile de ecran: site-ul se deschide direct pe chat cu linkul `https://harsovoiu.github.io/ai-alin/?chat=1`.

## Importanță
- **Nu** poți încărca un `.apk` direct pe Google Play — aici se pune mereu `.aab` (pe acela l-ai generat).
- Dacă vrei să încarci prima versiune pentru toți (nu doar test), trebuie complet înregistrat și aprobat; începe prudent cu test intern pentru verificare.

## iOS App Store — nota
Aplicatia asta **nu poate merge pe App Store** (iTunes): necesită Mac + cont Apple Developer de 99 $/an, iar aplicațiile WebView înveliș nu sunt acceptate. Dacă vrei prezență pe iPhone, soluția corectă e un „PWA" (site-ul se adaugă pe ecranul de pornire) — pot să fac asta.