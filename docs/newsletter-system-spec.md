# Newsletter systém — spec

Dátum: 2026-07-13
Repo: `dominikzazo-web` (Next.js 16 App Router, Vercel auto-deploy z `main`)

## Cieľ

Postaviť vlastný, ovládateľný newsletter systém pre dominikzazo.sk, ktorý:

1. Zbiera emaily do **vlastného Resend zoznamu** (Dominik vlastní publikum — filozofia „keby mi blokli Instagram, toto je miesto kde ma nestratíš").
2. Automaticky posiela **e-mailovú sekvenciu** (drip) — napr. 30 emailov postupne — cez vlastný scheduler nad Resendom (Resend nemá natívnu automation mašinu).
3. Má **user-friendly admin builder** (`/admin/newsletter`) na tvorbu a správu sekvencií, s **AI generovaním** emailov v Dominikovom tóne a s **podporou obrázkov**.
4. Ukazuje **funkčný archív** — reálne Substack články ako *proof of work*.

Toto je jeden súvislý produkt (capture → zoznam → engine → builder zdieľajú dátový model), preto jeden spec.

## Kontext existujúceho repa (znovupoužiť, neduplikovať)

- **Auth:** `lib/members/session.ts` → `getMember()` vracia `{ isAuthed, isAdmin, email, ... }`. `isAdmin` = email v `ADMIN_EMAILS` (default `zazodominik@gmail.com`). Admin builder gate = `isAdmin`. Žiadne nové heslo.
- **Úložisko:** `lib/cms/store.ts` — verziovaný Vercel Blob JSON (unikátna cesta `prefix-<ts>.json` obchádza CDN cache, drží posledných N verzií). Newsletter dáta ukladáme rovnakým vzorom.
- **Email:** `lib/members/notify.ts` používa **Resend** (`resend@^6.16.0`). Má `addToResendAudience()`, `sendWelcomeEmail()` (Kruh-špecifický), `pingDiscord()`. Newsletter dostane vlastný modul `lib/newsletter/`.
- **Substack archív:** `app/api/substack/route.ts` (GET) už vracia `{ items: [{ title, link, pubDate, preview, content, cover }] }` z RSS. Archív na `/newsletter` toto znovupoužije.
- **Nav:** `components/Nav.tsx` — SPA scroll sekcie (`go(id)`) + reálne `<Link>` routy (`/slow-life`, `/clenska`). `/newsletter` pridáme ako `<Link>`.
- **Upload:** `app/api/admin/upload/route.ts` + `components/admin/FileUploadForm.tsx` — existujúci upload do Vercel Blob (znovupoužiť pre obrázky v emailoch).
- **Design system:** krémová `#fafaf8`, ink `#1a1a1a`, Georgia serif nadpisy / Inter body, pill nav. Newsletter accent = bitcoin orange `#F7931A`.

## Rozsah — čo staviame teraz vs neskôr

### V rozsahu (tento spec)
- `/newsletter` verejná stránka (capture + funkčný Substack archív + testimonial sekcia so štruktúrou)
- Vlastný Resend newsletter zoznam (oddelený od Kruhu)
- Dátový model sekvencií + enrollmentov (Blob, verziovaný)
- Sekvenčný engine: Vercel Cron posiela emaily podľa delay-u cez Resend
- Welcome = email #1 sekvencie (delay 0)
- Podpora obrázkov v emailoch
- Admin builder `/admin/newsletter` (Clerk-gated, wizard, AI generovanie cez server route, ukladanie do Blobu)
- Nav položka `newsletter`

### Mimo rozsahu (neskôr, ale model to musí umožniť)
- **Vetvenie podľa správania** (open/click → iná cesta). Dátový model kroku pripraviť na podmienky; engine v tejto fáze vyhodnocuje len lineárne. Vetvenie = čistá fáza 2 (Resend webhooky `email.opened`/`email.clicked` → engagement stav → podmienené hrany).
- Ďalšie triggery (po kúpe, lead magnet). Model ich uloží; naživo zapojený je len `signup`.
- Reálna migrácia Substack odberateľov do Resendu.
- Prerobenie Substack sekcie na homepage.
- Funkčný obsah testimonialov (štruktúra áno, obsah doplní Dominik).
- Stránky `/bitcoin`, `/konzultacia` (samostatné specy).

## Architektúra

### Nový modul `lib/newsletter/`

- **`types.ts`** — typy:
  - `SequenceEmail { id, subject, body, delayDays, imageUrl?, next? }` — `next` je pripravené na podmienky (fáza 2), teraz nepoužité/undefined = lineárne.
  - `Sequence { id, name, trigger, active, emails: SequenceEmail[] }` — `trigger` enum: `'signup' | 'purchase' | 'lead_magnet' | 'manual'`.
  - `Enrollment { email, firstName?, sequenceId, enrolledAt, nextEmailIndex, nextSendAt, status }` — `status`: `'active' | 'done' | 'unsubscribed'`.
  - `NewsletterData { sequences: Sequence[], enrollments: Enrollment[] }`.
- **`store.ts`** — `readData()` / `writeData()` nad Vercel Blob, verziovaný vzor **skopírovaný z `lib/cms/store.ts`** (prefix napr. `newsletter/data`, `addRandomSuffix`, KEEP_VERSIONS, best-effort cleanup). SEED = prázdne `{ sequences: [], enrollments: [] }`.
- **`notify.ts`** — Resend vrstva:
  - `addToNewsletterAudience(email, firstName)` — `resend.contacts.create` do `RESEND_NEWSLETTER_AUDIENCE_ID` (no-op ak chýba env).
  - `sendSequenceEmail(to, subject, bodyHtml)` — pošle jeden email cez Resend z `NEWSLETTER_FROM_EMAIL` (fallback `MEMBERS_FROM_EMAIL`).
  - render tela: `body` (plain text s odriadkovaniami + voliteľný `imageUrl`) → jednoduchý branded HTML template (rovnaký vizuál ako Kruh welcome, ale oranžový akcent). Text verzia tiež.
- **`engine.ts`** — čistá logika sekvencie, testovateľná bez siete:
  - `enroll(data, email, firstName, trigger)` — nájde `active` sekvenciu pre `trigger`, pridá `Enrollment` s `nextEmailIndex=0`, `nextSendAt=now`. Idempotentné: ak už existuje aktívny enrollment pre (email, sequenceId), nepridá duplicitne.
  - `dueEnrollments(data, now)` — vráti enrollmenty so `status==='active'` a `nextSendAt <= now`.
  - `advance(enrollment, sequence, now)` — po odoslaní: `nextEmailIndex++`; ak existuje ďalší email → `nextSendAt = now + delayDays*86400000`; inak `status='done'`. (Čisto výpočet, žiadne IO.)

### API routy

- **`app/api/newsletter/subscribe/route.ts`** (POST) — telo `{ email, firstName?, website? }` (`website` = honeypot; ak vyplnené → ticho OK bez akcie). Validuje email. Kroky: `addToNewsletterAudience()`, načíta `readData()`, `enroll(...)`, `writeData()`. Ak je nový enrollment splatný hneď (email #1, delay 0) → pošle ho hneď cez `sendSequenceEmail()` a `advance()` (aby welcome nečakal na cron). `pingDiscord()` best-effort. Vracia `{ ok: true }`. Chyby → `{ ok:false, error }` + vhodný status. Runtime `nodejs`.
- **`app/api/newsletter/cron/route.ts`** (GET) — chránené `CRON_SECRET` (header `Authorization: Bearer` alebo `?secret=`). Načíta data, pre každý `dueEnrollments(now)` pošle aktuálny email, `advance()`, po prejdení všetkých `writeData()` raz. Vracia počet odoslaných. Idempotentné voči duplicitnému behu v rámci istoty (spracuje len splatné). Runtime `nodejs`, `maxDuration` primerane.
- **`app/api/admin/newsletter/route.ts`** — admin CRUD sekvencií. GET (list) + PUT (uloženie celého `sequences` poľa). **Musí volať `getMember()` a odmietnuť ak `!isAdmin`** (403). Nemodifikuje `enrollments`.
- **`app/api/admin/newsletter/generate/route.ts`** (POST) — AI generovanie. Gate `isAdmin`. Telo `{ topic, index, seqName, prevSubjects[] }`. Volá Anthropic **na serveri** (kľúč `ANTHROPIC_API_KEY` nikdy v prehliadači). Vracia `{ subject, body }`. Model: `claude-sonnet-5` (implementer overí presné ID + SDK vzor cez skill `claude-api`). System prompt = Dominikov tón (nižšie).
- **Vercel cron config:** v `vercel.json` (alebo `vercel.ts`) job `{ path: '/api/newsletter/cron', schedule: '0 8 * * *' }` — raz denne (delay je v dňoch → denný cron stačí; pozor na limit Hobby plánu = 1×/deň).

### Verejná stránka `/newsletter`

- **`app/newsletter/page.tsx`** — server shell, tvoj layout + Nav. Sekcie:
  1. **Hero + capture**: headline v tóne „keby mi blokli Instagram…", 2–3 vety čo dostanú, `<SubscribeForm>`.
  2. **Archív (proof of work)**: server-side fetch `/api/substack` (alebo priamo funkcia) → zoznam posledných článkov (title, náhľad, cover, link na Substack). Nadpis „pozri si predošlé".
  3. **Testimonialy**: „čo hovoria iní" — štruktúra kariet, obsah placeholder (jasne označené TODO na doplnenie).
- **`components/newsletter/SubscribeForm.tsx`** (`'use client'`) — email input + submit, honeypot `website` (skryté), inline stavy: idle / loading / success („skontroluj schránku") / error. POST na `/api/newsletter/subscribe`.

### Admin builder `/admin/newsletter`

- **`app/admin/newsletter/page.tsx`** — server komponent: `getMember()`; ak `!isAdmin` → redirect na `/` alebo 404. Načíta sekvencie (server) a odovzdá klientovi.
- **`components/admin/newsletter/*`** — port prototypu (`~/Downloads/email_sequence_builder.html`) do React/TSX v design systéme:
  - Zoznam sekvencií (karty: názov, počet emailov, trigger) + „Nová".
  - Wizard: (1) Základ (názov + trigger), (2) Emaily (pridať/upraviť/presúvať/mazať), (3) Prehľad. **Krok „Brevo" z prototypu vypustiť** — nepoužívame Brevo.
  - Email editor: predmet + telo + delay (dni) + **obrázok** (upload cez existujúci `/api/admin/upload` → `imageUrl`) + **AI asistent** (volá `/api/admin/newsletter/generate`, nie priamo Anthropic).
  - Ukladanie: PUT `/api/admin/newsletter` (Blob), **nie `window.storage`**.
- Nav pre admina: odkaz na `/admin/newsletter` sa zobrazí len ak `isAdmin` (napr. v admin UI alebo v pätičke členskej sekcie — konzistentne s existujúcim `/clenska/admin`).

### AI system prompt (generovanie emailov)

```
Si Dominik Žažo – 22-ročný Slovák, bitcoin educator. Píšeš email do sekvencie pre odberateľov.
Tvoj štýl: ľudský, tichý, bez hype. Krátke vety. Rytmus. Žiadne "super/skvelé/úžasné".
Žiadne "som rád že si tu" ani "dúfam že sa ti páčilo". Žiadne vágne záverečné otázky.
Bitcoin = ochrana hodnoty tvojej práce, nie "number go up". Konkrétnosť nad abstrakciou.
Odpovedz PRESNE v tomto formáte a nič iné:
PREDMET: [max 8 slov]
---
[telo emailu 80–130 slov, bez oslovia ani podpisu]
```

## Env premenné (nové)

```
RESEND_NEWSLETTER_AUDIENCE_ID=   # samostatný Resend zoznam (oddelený od RESEND_AUDIENCE_ID / Kruh)
NEWSLETTER_FROM_EMAIL=Dominik Žažo <ahoj@dominikzazo.sk>   # fallback: MEMBERS_FROM_EMAIL
ANTHROPIC_API_KEY=               # server-side AI generovanie
CRON_SECRET=                     # ochrana /api/newsletter/cron
```
Znovupoužité: `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAILS`, Clerk kľúče, `DISCORD_WEBHOOK_URL`. Doplniť do `.env.local.example`.

## Bezpečnosť

- `ANTHROPIC_API_KEY` a Resend volania **len na serveri** (route handlery). Prototyp volal Anthropic z prehliadača — to nerobíme.
- Admin routy (`/api/admin/newsletter*`) tvrdo overujú `isAdmin` cez `getMember()`.
- Cron route chránená `CRON_SECRET`.
- Honeypot na subscribe proti botom; základná validácia emailu.

## Testovanie / verifikácia

- **Unit (engine.ts):** `enroll` (nájde aktívnu sekvenciu, idempotencia), `dueEnrollments` (filtruje podľa času/statusu), `advance` (posun indexu, výpočet nextSendAt, done na konci). Čisté funkcie, bez siete.
- **Manuálne cez dev server:**
  - Subscribe test emailom → `{ ok:true }`, welcome (email #1) príde, kontakt v Resende (alebo čistý no-op bez audience ID), žiadne chyby v console/network.
  - Admin: vytvor sekvenciu (2–3 emaily, delay 0/1/2), ulož → objaví sa po reloade (Blob). AI generovanie vráti predmet+telo. Upload obrázka → zobrazí sa v náhľade.
  - Cron: zavolaj `/api/newsletter/cron` s `CRON_SECRET` → pošle splatné, posunie enrollmenty; druhé zavolanie hneď = 0 odoslaných (nič splatné).
- **Gate:** `/admin/newsletter` bez admin emailu → redirect/404. Admin API bez auth → 403.

## Poradie stavby (návrh taskov pre plán)

1. `lib/newsletter/types.ts` + `store.ts` (Blob, port z cms/store) + unit-testovateľné základy.
2. `lib/newsletter/engine.ts` + unit testy (enroll/dueEnrollments/advance).
3. `lib/newsletter/notify.ts` (Resend audience + send + HTML/text render s obrázkom).
4. `app/api/newsletter/subscribe/route.ts` (+ honeypot, okamžitý welcome).
5. `app/newsletter/page.tsx` + `components/newsletter/SubscribeForm.tsx` + funkčný Substack archív + testimonial štruktúra.
6. Nav: pridať `newsletter` `<Link>`.
7. `app/api/newsletter/cron/route.ts` + cron config (`vercel.json`/`vercel.ts`) + `CRON_SECRET`.
8. `app/api/admin/newsletter/route.ts` (CRUD, isAdmin gate).
9. `app/api/admin/newsletter/generate/route.ts` (server AI, claude-api skill na model/SDK).
10. Admin builder UI `app/admin/newsletter/` + `components/admin/newsletter/*` (port prototypu, obrázky, ukladanie do Blobu).
11. `.env.local.example` update + krátky `docs/` návod na nastavenie (Resend audience, CRON_SECRET, ANTHROPIC_API_KEY).

Každý task: TDD kde dáva zmysel (engine), commit, spec + code-quality review.
```
