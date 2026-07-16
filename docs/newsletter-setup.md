# Newsletter systém — nastavenie

Vlastný newsletter na dominikzazo.sk: capture na `/newsletter`, automatická
e-mailová sekvencia (drip) cez Vercel Cron + Resend, a admin builder na
`/admin/newsletter`. Detaily architektúry: `docs/newsletter-system-spec.md`.

## 1. Env premenné

Doplň do `.env.local` (lokálne) aj do Vercel → Settings → Environment Variables
(produkcia). Vzor je v `.env.local.example`.

| Premenná | Načo | Kde získať |
| --- | --- | --- |
| `RESEND_NEWSLETTER_AUDIENCE_ID` | vlastný zoznam odberateľov | Resend → Audiences → vytvor „Newsletter" → skopíruj ID |
| `NEWSLETTER_FROM_EMAIL` | odosielateľ (voliteľné) | doména verifikovaná v Resende; inak sa použije `MEMBERS_FROM_EMAIL` |
| `ANTHROPIC_API_KEY` | AI generovanie emailov v admine | console.anthropic.com → API Keys |
| `CRON_SECRET` | ochrana cron endpointu **+ podpis potvrdzovacích (double opt-in) a odhlasovacích linkov** | vygeneruj náhodný reťazec (napr. `openssl rand -hex 16`) |
| `RESEND_WEBHOOK_SECRET` | overenie podpisu Resend webhooku (open/klik/bounce) | Resend → Webhooks → tvoj endpoint → **Signing Secret** (`whsec_…`), viď sekciu 6 |

Znovupoužité (už existujú pre členskú sekciu): `RESEND_API_KEY`,
`BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAILS`, Clerk kľúče, `DISCORD_WEBHOOK_URL`.

## 2. Resend zoznam

1. Resend → **Audiences** → vytvor nový zoznam (napr. „Newsletter").
2. Skopíruj jeho ID do `RESEND_NEWSLETTER_AUDIENCE_ID`.
3. Odosielateľská doména (`dominikzazo.sk`) musí byť v Resende verifikovaná.

Bez tohto ID sa odberateľ stále zapíše do sekvencie (Blob), len sa nepridá ako
kontakt do Resendu.

## 3. Cron (automatické posielanie)

- `vercel.json` spúšťa `/api/newsletter/cron` **raz denne o 08:00**.
- Oneskorenia emailov sú v dňoch, takže denný cron stačí.
- Vercel pri spustení cronu automaticky pošle `Authorization: Bearer $CRON_SECRET`,
  takže endpoint je chránený. **`CRON_SECRET` musí byť nastavené v produkcii.**
- Manuálny test lokálne:
  ```bash
  curl "http://localhost:3000/api/newsletter/cron?secret=$CRON_SECRET"
  # -> {"ok":true,"sent":N}
  ```

## 4. Vytvorenie prvej sekvencie (admin)

1. Prihlás sa (Clerk) emailom, ktorý je v `ADMIN_EMAILS`.
2. Choď na **`/admin/newsletter`**.
3. „+ Nová" → wizard:
   - **Základ:** názov, trigger `signup`, nechaj **active** zapnuté.
   - **Emaily:** pridávaj emaily (predmet, telo, oneskorenie v dňoch, voliteľne obrázok).
     Email #1 má oneskorenie 0 = odíde hneď po prihlásení (welcome).
     AI asistent vygeneruje predmet + telo v tvojom tóne.
   - **Prehľad:** skontroluj a **Ulož**.
4. Len **aktívna** sekvencia s triggerom `signup` sa spustí novým odberateľom.
   Maj naraz aktívnu jednu signup sekvenciu.

Ako to beží (**double opt-in**): subscribe → pošle sa len potvrdzovací mail
(nič sa neukladá) → človek klikne na potvrdzovací link (platí 7 dní) → **až
teraz** kontakt do Resendu + enrollment do aktívnej sekvencie + email #1 hneď +
zápis súhlasu (`consentAt`, `consentIp` = GDPR dôkaz). Ďalšie emaily posiela
denný cron podľa oneskorenia.

## 5. Odberatelia (admin)

**`/admin/newsletter/odberatelia`** — kto je v sekvencii, kde sa nachádza
(postup X/Y), status (aktívny / dokončený / odhlásený / bounce), kedy mu ide
ďalší mail a či otvoril/klikol posledný odoslaný mail.

## 6. Resend webhook (open/klik/bounce tracking)

Bez tohto kroku panel funguje, len stĺpce „otvoril/klikol" ostanú prázdne.

1. Resend → **Webhooks** → **Add Webhook**.
2. Endpoint URL: **`https://dominikzazo.sk/api/newsletter/webhook`**
3. Zapni eventy: `email.sent`, `email.delivered`, `email.opened`,
   `email.clicked`, `email.bounced`, `email.complained`.
4. Skopíruj **Signing Secret** (`whsec_…`) → Vercel → Settings → Environment
   Variables → `RESEND_WEBHOOK_SECRET` (Production) → **redeploy**.
5. Over: Resend → Webhooks → tvoj endpoint → **Send test event** → musí prísť
   `200 OK`. (Bez správneho secretu vráti route `401 invalid signature`,
   bez nastavenej premennej `500 not configured`.)

Ako to funguje: drip maily posielame s tagmi `source=drip`, `seq=<id sekvencie>`,
`idx=<poradie mailu>` — webhook ich dostane späť a priradí event ku konkrétnemu
mailu. Broadcast (týždenné 1·1·1) nesie `broadcast_id` natívne. Eventy sa
zapisujú do `events[]` v Blob dátach.

**Hard bounce** (`Permanent`) automaticky zastaví drip tomu človeku
(status `bounced`) — chráni reputáciu odosielateľa. Dočasný (`Transient`) bounce
sa len zaznamená.

**Čo email NEVIE zmerať:** scroll ani to, kam sa človek dočítal — technicky to
v maili nejde. Vie len **otvorenie** (sledovací pixel) a **klik** na link.
Otvorenie je navyše nepresné: Gmail občas pixel prednačíta (falošné otvorenie),
a kto má blokované obrázky, otvorenie nezaznamená. **Klik je spoľahlivejší.**

## 7. Fáza 2 (do budúcna) — vetvenie podľa správania

Dátový model je pripravený: `SequenceEmail.next` (rezerva pre podmienené hrany)
+ engagement log `events[]` a `engagementFor(data, email, ref)` v
`lib/newsletter/engagement.ts`. Vetvenie („ak otvoril/klikol → iná cesta") sa
naň napojí. Zatiaľ beží lineárny drip.
