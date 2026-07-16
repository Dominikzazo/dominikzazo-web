# Admin „Odberatelia" + open/click tracking — návrh

Dátum: 2026-07-16 · Vetva: `feature/newsletter-system`

## Cieľ

Vidieť, kto je prihlásený, kde je v drip sekvencii, kedy mu ide ďalší mail a
či otvára/klikal — základ pre fázu 2 (if-podmienky / vetvenie cez
`SequenceEmail.next`). Tracking pokrýva **drip aj broadcast**.

## Rozhodnutia (potvrdené Dominikom)

- **Rozsah:** trackovať drip aj týždenný 1·1·1 broadcast.
- **Bounce:** hard bounce → automaticky zastaviť drip tomu človeku (status `bounced`). Soft bounce sa len zaznamená.
- **Postup:** dva deploye — najprv panel, potom tracking.

## Dátový model — globálny event log

Nové pole v `NewsletterData`: `events: EngagementEvent[]` (append-only).

```ts
export type EngagementType =
  | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'

export interface EngagementEvent {
  email: string
  type: EngagementType
  source: 'drip' | 'broadcast'
  ref?: string      // drip: `${sequenceId}:${emailIndex}` · broadcast: broadcastId
  at: string        // ISO
  resendId?: string // Resend data.email_id (dedup/debug)
}

// NewsletterData: { sequences, enrollments, events }
```

`EnrollmentStatus` sa rozšíri o `'bounced'`. `store.ts` `readData` doplní
`events: data.events ?? []` (spätná kompatibilita so starými Blob záznamami).

Prečo event log a nie per-enrollment: broadcast nie je enrollment, per-enrollment
model by ho nezachytil. Log zvládne oba zdroje a fáza 2 z neho odvodí podmienky
(„otvoril email #2?" = existuje `opened` event s `ref=seqId:2` pre danú adresu).

## `lib/newsletter/engagement.ts` (nový, TDD)

- `recordEvent(data, e): NewsletterData` — pripojí event (immutable).
- `applyBounce(data, email): NewsletterData` — aktívne enrollmenty tej adresy → `status:'bounced'` (zastaví drip). Ostatné statusy nechá.
- `engagementFor(data, email, ref): { opened: boolean; clicked: boolean }` — pre tabuľku aj budúce vetvenie.
- `mapResendEvent(payload): EngagementEvent | null` — čistá mapovacia funkcia z Resend webhook payloadu; neznámy typ → `null`.

## Deploy 1 — Admin panel „Odberatelia"

- GET `/api/admin/newsletter` rozšíriť: vráti aj `enrollments` (dnes len `sequences`).
- Nová stránka `app/admin/newsletter/odberatelia/page.tsx` — server component, `getMember()` + `if (!m.isAdmin) redirect('/')` (vzor ako `app/admin/newsletter/page.tsx`), renderuje client komponent.
- Client komponent `components/admin/newsletter/Odberatelia.tsx` — fetch dát, tabuľka mobilne čitateľná:
  **email · sekvencia (name) · postup (`index/total`, napr. 2/5) · status · ďalší mail** (relatívne, napr. „o 2 dni" / „dnes" / „—" ak done/unsub/bounced).
- Dlaždica/link z `/admin/newsletter` (a prípadne `/clenska/admin`).
- Deploy 1 ešte NEobsahuje stĺpce otvoril?/klikol? (tie prídu s trackingom).

## Deploy 2 — Tracking cez Resend webhook

- Nová route `app/api/newsletter/webhook/route.ts` (POST, `runtime nodejs`):
  - Overí Resend podpis cez **Svix** (`svix` dependency, `RESEND_WEBHOOK_SECRET`, hlavičky `svix-id/svix-timestamp/svix-signature`).
  - `mapResendEvent(payload)` → `recordEvent`. Hard bounce (`email.bounced` s bounce type hard) → `applyBounce`.
  - Vždy vráti 200 (aj pri ignorovanom evente), nech Resend neretryuje zbytočne; neplatný podpis → 401.
- Drip send (`sendSequenceEmail`) dostane `tags: { source:'drip', seq: sequenceId, idx: String(index) }` — nech webhook vie priradiť `ref`. (Resend tag hodnoty = ASCII, `sequenceId` typu `s1` vyhovuje.)
- Broadcast eventy nesú `broadcast_id` natívne → `source:'broadcast', ref: broadcastId`.
- Tabuľka dostane stĺpce **otvoril? · klikol?** (`engagementFor` pre posledný odoslaný drip email daného enrollmentu) + `bounced` badge.
- Nastavenie webhooku v Resend dashboarde (endpoint URL, vybrané eventy, signing secret) → `docs/newsletter-setup.md`.

## Resend event → náš model (mapResendEvent)

| Resend `type`        | náš `type`  |
|----------------------|-------------|
| `email.sent`         | `sent`      |
| `email.delivered`    | `delivered` |
| `email.opened`       | `opened`    |
| `email.clicked`      | `clicked`   |
| `email.bounced`      | `bounced`   |
| `email.complained`   | `complained`|
| ostatné (delivery_delayed…) | `null` (ignoruj) |

`source`/`ref`: z `data.tags` (drip) alebo `data.broadcast_id` (broadcast).
`email`: z `data.to[0]` alebo `data.email`. `resendId`: `data.email_id`.

## Obmedzenie (povedané Dominikovi)

Email meria len **open (pixel)** a **klik na link** — NIE scroll ani „kam sa
dočítal". Open je nepresný: Gmail image proxy môže pixel prednačítať (false
open), blokované obrázky open nezaznamenajú. **Klik = spoľahlivejší signál**
pre budúce vetvenie.

## Testy (TDD)

`lib/newsletter/__tests__/engagement.test.ts`:
- `recordEvent` pripojí event, nemení pôvodné pole (immutable)
- `applyBounce` označí aktívne enrollmenty adresy ako `bounced`, iné nechá
- `engagementFor` vráti `opened:true/clicked:true` len keď existuje zodpovedajúci event pre `(email, ref)`
- `mapResendEvent` mapuje známe typy, `null` pre neznámy; správne odvodí `source`/`ref` z tags aj broadcast_id

Webhook podpis (Svix) = integračné, mimo unit testov; logika je v `mapResendEvent`, ktorá je testovaná.

## Mimo rozsahu (neskôr)

- Fáza 2: reálne vetvenie drip sekvencie podľa engagementu (`SequenceEmail.next`).
- Zobrazenie broadcast engagementu v UI (dáta sa zbierajú; detailný pohľad neskôr).
- Prunning event logu (zatiaľ malý objem, netreba).
