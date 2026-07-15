# Double opt-in — návrh

Dátum: 2026-07-15 · Vetva: `feature/newsletter-system`

## Cieľ

GDPR dôkaz súhlasu + bránenie fake/bot signupom + lepšia doručiteľnosť.
Človek sa po vyplnení formulára stane **odberateľom až po kliknutí na
potvrdzovací link v maili**. Do potvrdenia sa nikam neukladá (stateless —
e-mail je v linku, HMAC token ho podpisuje).

## Tok

```
Signup form → POST /api/newsletter/subscribe
   → validácia e-mailu + honeypot
   → NIČ sa neuloží, žiadny Resend kontakt, žiadny enrollment
   → pošle "Potvrď prihlásenie" mail s podpísaným linkom
   → UI success: "Skontroluj schránku a potvrď prihlásenie"

Klik v maili → GET /api/newsletter/confirm?e=&n=&x=&t=
   → verifyConfirm(email, exp, token)
       - neplatný → stránka "Neplatný odkaz"
       - vypršaný → stránka "Link vypršal, prihlás sa znova" (link na /newsletter)
       - platný ↓
   → addToNewsletterAudience(email, firstName)
   → enroll(..., consent:{ at, ip })   // consentAt + consentIp na Enrollment
   → pošle welcome (email #0) hneď + advance
   → pingDiscord(email, firstName)
   → stránka "Potvrdené 🤍"
```

## Rozhodnutia (potvrdené Dominikom)

- **Expirácia linku:** 7 dní. Token nesie expiráciu (unix ms) v čistom, HMAC ju
  podpisuje. Po expirácii pekná stránka s výzvou prihlásiť sa znova.
- **Dôkaz súhlasu:** `consentAt` (ISO timestamp) + `consentIp` (z requestu) na
  Enrollment. IP = štandardný GDPR dôkaz double opt-inu.
- **Discord ping:** až pri potvrdení (reálny odberateľ), nie pri pokuse.

## Zmeny v súboroch

### `lib/newsletter/confirm.ts` (nový)
- `confirmToken(email, exp): string` = `HMAC-SHA256(CRON_SECRET, "confirm:" + email + ":" + exp)` skrátený na 32 znakov. Prefix `confirm:` odlíši od unsub tokenu — unsub link nepotvrdí a confirm link neodhlási.
- `confirmUrl(email, firstName?): string` → `${SITE}/api/newsletter/confirm?e=&n=&x=<exp>&t=<token>`, `exp = Date.now() + 7*86400000`.
- `verifyConfirm(email, exp, token): { ok: boolean; expired: boolean }` — timingSafeEqual na token + kontrola `exp > Date.now()`. Ak token sedí ale `exp` prešiel → `{ ok:false, expired:true }`.
- `renderConfirmHtml(email, firstName?)` + `renderConfirmText(...)` — plain listový štýl (Georgia serif, hlavička "Dominik Žažo" ako v render.ts) + jedno CTA tlačidlo "Potvrď prihlásenie →" (bitcoin orange `#F7931A`) + fallback textový link.

### `lib/newsletter/notify.ts`
- `sendConfirmEmail(to, firstName?)` — pošle confirm mail cez `resend.emails.send` (transakčný → Primary tab). Bez List-Unsubscribe hlavičiek (človek ešte nie je odberateľ).

### `lib/newsletter/types.ts`
- `Enrollment` + `consentAt?: string`, `consentIp?: string` (voliteľné → staré záznamy ostávajú validné).

### `lib/newsletter/engine.ts`
- `enroll(data, email, firstName, trigger, now?, consent?)` — nový voliteľný param `consent?: { at: string; ip?: string }`; keď je zadaný, zapíše `consentAt`/`consentIp` na nový enrollment.

### `app/api/newsletter/subscribe/route.ts`
- Odstráni `addToNewsletterAudience` + `enroll` + `sendSequenceEmail` + `pingDiscord`.
- Po validácii + honeypote iba `sendConfirmEmail(email, firstName)` a vráti `{ ok: true }`.

### `app/api/newsletter/confirm/route.ts` (nový, GET)
- Parse `e, n, x, t` → `verifyConfirm`.
- Stránka (helper `page(title, sub, status)` ako v unsubscribe route) pre stavy: neplatný / vypršaný / potvrdené.
- Pri platnom: `addToNewsletterAudience` → `readData` → `enroll(..., consent)` → ak je email #0 splatný hneď, pošli welcome + `advance` → `writeData` → `pingDiscord`.
- **Idempotentne:** ak už existuje aktívny enrollment (enroll ho nevytvorí znova), NEposielaj welcome druhýkrát ani nepinguj — ukáž len "Už si potvrdený 🤍".

### Frontend
- `components/newsletter/SubscribeForm.tsx` success: „Skontroluj schránku a potvrď prihlásenie. 🤍 / Poslal som ti potvrdzovací mail — klikni v ňom a si dnu."
- `components/BottomSurprise*` success: obdobne „Skoro! Skontroluj schránku a potvrď. 🌿"

## Testy (TDD)

`lib/newsletter/__tests__/confirm.test.ts`:
- platný token pre `(email, exp)` → `verifyConfirm` `{ ok:true, expired:false }`
- tampered token → `{ ok:false }`
- iný e-mail s tým istým tokenom → `{ ok:false }`
- expirovaný `exp` (v minulosti) s platným tokenom → `{ ok:false, expired:true }`
- unsub token (z `unsubscribe.ts`) podaný ako confirm token → neprejde (purpose separation)

`lib/newsletter/__tests__/engine.test.ts` (rozšírenie):
- `enroll(..., consent:{at, ip})` zapíše `consentAt`/`consentIp` na nový enrollment
- `enroll` bez consent param → polia ostanú undefined (spätná kompatibilita)

## Bezpečnosť / edge

- E-mail a exp sú v URL v čistom, token ich podpisuje — nedá sa podvrhnúť cudzí
  e-mail ani predĺžiť expiráciu bez CRON_SECRET.
- Meno `n` nie je podpísané → ovplyvní len oslovenie welcome mailu, nie
  bezpečnosť. Prípadné XSS ošetrí `esc()` pri renderi.
- Confirm nič neukladá pred potvrdením → žiadny stav na čistenie, žiadny leak
  pending záznamov.
```

## Mimo rozsahu (neskôr)

- Admin panel „Odberatelia" + open/click tracking (bod 2 zadania).
- Migrácia existujúcich single-opt-in odberateľov (nie je potrebná — ostávajú).
