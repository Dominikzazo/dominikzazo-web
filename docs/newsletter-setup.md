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
| `CRON_SECRET` | ochrana cron endpointu | vygeneruj náhodný reťazec (napr. `openssl rand -hex 16`) |

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

Ako to beží: subscribe → kontakt do Resendu + enrollment do aktívnej sekvencie +
email #1 hneď. Ďalšie emaily posiela denný cron podľa oneskorenia.

## 5. Fáza 2 (do budúcna) — vetvenie podľa správania

Dátový model je pripravený (`SequenceEmail.next`). Vetvenie („ak otvoril/klikol →
iná cesta") pridáme cez Resend webhooky (`email.opened`, `email.clicked`) →
engagement stav → podmienené hrany v engine. Zatiaľ beží lineárny drip.
