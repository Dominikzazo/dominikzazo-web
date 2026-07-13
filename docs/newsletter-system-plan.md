# Newsletter systém — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vlastný newsletter systém pre dominikzazo.sk — capture do Resend zoznamu, automatická e-mailová sekvencia (drip) cez vlastný Vercel Cron engine, admin builder s AI generovaním a obrázkami, a funkčný Substack archív.

**Architecture:** Nový modul `lib/newsletter/` (types + Blob store + čistý engine + Resend notify). Verejná stránka `/newsletter` (capture + archív). API routy pre subscribe, cron, admin CRUD a AI generovanie. Admin builder `/admin/newsletter` (Clerk `isAdmin` gate) portovaný z prototypu. Sekvencie/enrollmenty vo verziovanom Vercel Blobe (vzor `lib/cms/store.ts`).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vercel Blob (`@vercel/blob`), Resend (`resend`), Anthropic SDK (`@anthropic-ai/sdk`), Clerk (existing), Vercel Cron.

**Spec:** `docs/newsletter-system-spec.md`

---

## File Structure

**New module `lib/newsletter/`:**
- `types.ts` — všetky typy (Sequence, SequenceEmail, Enrollment, NewsletterData).
- `store.ts` — `readData()`/`writeData()` nad Vercel Blob (verziovaný, port z `lib/cms/store.ts`).
- `engine.ts` — čisté funkcie `enroll`, `dueEnrollments`, `advance` (unit-testovateľné bez IO).
- `render.ts` — `renderEmailHtml(body, imageUrl?)` + `renderEmailText(body)` (branded template, oranžový akcent).
- `notify.ts` — Resend: `addToNewsletterAudience`, `sendSequenceEmail`.

**Tests:**
- `lib/newsletter/__tests__/engine.test.ts` — unit testy engine.

**API:**
- `app/api/newsletter/subscribe/route.ts` — POST subscribe.
- `app/api/newsletter/cron/route.ts` — GET cron (CRON_SECRET).
- `app/api/admin/newsletter/route.ts` — GET/PUT sekvencie (isAdmin).
- `app/api/admin/newsletter/generate/route.ts` — POST AI generovanie (isAdmin).

**Verejná stránka:**
- `app/newsletter/page.tsx` — server shell (hero+capture, archív, testimonialy).
- `components/newsletter/SubscribeForm.tsx` — `'use client'` formulár.

**Admin builder:**
- `app/admin/newsletter/page.tsx` — server gate + načítanie dát.
- `components/admin/newsletter/NewsletterAdmin.tsx` — root client komponent (port prototypu).
- `components/admin/newsletter/EmailEditor.tsx` — editor emailu (predmet/telo/delay/obrázok/AI).

**Config/infra:**
- `components/Nav.tsx` — pridať `newsletter` link (modify).
- `vercel.json` — cron config (create).
- `.env.local.example` — nové env (modify).
- `package.json` — pridať test skript + `@anthropic-ai/sdk` + vitest (modify).

---

## Testing setup poznámka

Repo **nemá** test runner. Task 0 pridá **Vitest** (ľahký, funguje s TS/ESM) len pre unit testy v `lib/`. Nekonfliktuje s Next buildom.

---

### Task 0: Test runner (Vitest) + Anthropic SDK

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install deps**

Run:
```bash
npm install --save-dev vitest
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Add test script to package.json**

V `"scripts"` pridaj:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify runner works (no tests yet is OK)**

Run: `npm test`
Expected: Vitest runs, "No test files found" alebo 0 tests — exit 0/1 bez chyby konfigurácie.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest + anthropic sdk"
```

---

### Task 1: Types (`lib/newsletter/types.ts`)

**Files:**
- Create: `lib/newsletter/types.ts`

- [ ] **Step 1: Write the types**

```ts
// Dátový model newsletter systému. `next` na SequenceEmail je pripravené
// na vetvenie (fáza 2) — teraz vždy undefined = lineárny drip.

export type SequenceTrigger = 'signup' | 'purchase' | 'lead_magnet' | 'manual'

export interface SequenceEmail {
  id: string
  subject: string
  body: string // plain text s \n odriadkovaniami
  delayDays: number // dni po predošlom emaily; email #0 má 0 (odíde hneď)
  imageUrl?: string // voliteľný obrázok (Vercel Blob URL)
  next?: unknown // rezerva pre podmienky/vetvenie (fáza 2)
}

export interface Sequence {
  id: string
  name: string
  trigger: SequenceTrigger
  active: boolean
  emails: SequenceEmail[]
}

export type EnrollmentStatus = 'active' | 'done' | 'unsubscribed'

export interface Enrollment {
  email: string
  firstName?: string
  sequenceId: string
  enrolledAt: string // ISO
  nextEmailIndex: number // index ďalšieho emailu na odoslanie
  nextSendAt: string // ISO — kedy poslať nextEmailIndex
  status: EnrollmentStatus
}

export interface NewsletterData {
  sequences: Sequence[]
  enrollments: Enrollment[]
}

export const EMPTY_NEWSLETTER_DATA: NewsletterData = { sequences: [], enrollments: [] }
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/newsletter/types.ts
git commit -m "feat(newsletter): data model types"
```

---

### Task 2: Engine (`lib/newsletter/engine.ts`) — TDD

**Files:**
- Create: `lib/newsletter/engine.ts`
- Test: `lib/newsletter/__tests__/engine.test.ts`

Engine = čisté funkcie, žiadne IO. Kľúč pre spoľahlivosť celého dripu.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { enroll, dueEnrollments, advance } from '../engine'
import type { NewsletterData, Sequence } from '../types'

const seq: Sequence = {
  id: 's1', name: 'Welcome', trigger: 'signup', active: true,
  emails: [
    { id: 'e0', subject: 'A', body: 'a', delayDays: 0 },
    { id: 'e1', subject: 'B', body: 'b', delayDays: 3 },
  ],
}

function baseData(): NewsletterData {
  return { sequences: [seq], enrollments: [] }
}

describe('enroll', () => {
  it('adds an active enrollment at index 0, due now, for matching trigger', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const d = enroll(baseData(), 'x@test.sk', 'X', 'signup', now)
    expect(d.enrollments).toHaveLength(1)
    const e = d.enrollments[0]
    expect(e).toMatchObject({ email: 'x@test.sk', sequenceId: 's1', nextEmailIndex: 0, status: 'active' })
    expect(new Date(e.nextSendAt).getTime()).toBe(now.getTime())
  })

  it('is idempotent — does not double-enroll same email in same active sequence', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    let d = enroll(baseData(), 'x@test.sk', 'X', 'signup', now)
    d = enroll(d, 'x@test.sk', 'X', 'signup', now)
    expect(d.enrollments).toHaveLength(1)
  })

  it('does nothing if no active sequence for trigger', () => {
    const data: NewsletterData = { sequences: [{ ...seq, active: false }], enrollments: [] }
    const d = enroll(data, 'x@test.sk', 'X', 'signup', new Date())
    expect(d.enrollments).toHaveLength(0)
  })
})

describe('dueEnrollments', () => {
  it('returns only active enrollments whose nextSendAt <= now', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const data: NewsletterData = {
      sequences: [seq],
      enrollments: [
        { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '2026-07-14T07:00:00Z', status: 'active' },
        { email: 'b@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 1, nextSendAt: '2026-07-20T07:00:00Z', status: 'active' },
        { email: 'c@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '2026-07-14T07:00:00Z', status: 'done' },
      ],
    }
    const due = dueEnrollments(data, now)
    expect(due.map(e => e.email)).toEqual(['a@test.sk'])
  })
})

describe('advance', () => {
  it('moves to next email and schedules by delayDays', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const e = { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '', status: 'active' as const }
    const next = advance(e, seq, now)
    expect(next.nextEmailIndex).toBe(1)
    expect(next.status).toBe('active')
    expect(new Date(next.nextSendAt).getTime()).toBe(now.getTime() + 3 * 86400000)
  })

  it('marks done after last email', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const e = { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 1, nextSendAt: '', status: 'active' as const }
    const next = advance(e, seq, now)
    expect(next.nextEmailIndex).toBe(2)
    expect(next.status).toBe('done')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`
Expected: FAIL (engine functions not defined).

- [ ] **Step 3: Implement engine**

```ts
import type { NewsletterData, Sequence, Enrollment, SequenceTrigger } from './types'

function activeSequenceFor(data: NewsletterData, trigger: SequenceTrigger): Sequence | undefined {
  return data.sequences.find((s) => s.active && s.trigger === trigger)
}

export function enroll(
  data: NewsletterData,
  email: string,
  firstName: string | undefined,
  trigger: SequenceTrigger,
  now: Date = new Date(),
): NewsletterData {
  const seq = activeSequenceFor(data, trigger)
  if (!seq || seq.emails.length === 0) return data

  const already = data.enrollments.some(
    (e) => e.email === email && e.sequenceId === seq.id && e.status === 'active',
  )
  if (already) return data

  const enrollment: Enrollment = {
    email,
    firstName,
    sequenceId: seq.id,
    enrolledAt: now.toISOString(),
    nextEmailIndex: 0,
    nextSendAt: now.toISOString(),
    status: 'active',
  }
  return { ...data, enrollments: [...data.enrollments, enrollment] }
}

export function dueEnrollments(data: NewsletterData, now: Date = new Date()): Enrollment[] {
  return data.enrollments.filter(
    (e) => e.status === 'active' && new Date(e.nextSendAt).getTime() <= now.getTime(),
  )
}

export function advance(enrollment: Enrollment, sequence: Sequence, now: Date = new Date()): Enrollment {
  const nextIndex = enrollment.nextEmailIndex + 1
  const nextEmail = sequence.emails[nextIndex]
  if (!nextEmail) {
    return { ...enrollment, nextEmailIndex: nextIndex, status: 'done' }
  }
  return {
    ...enrollment,
    nextEmailIndex: nextIndex,
    nextSendAt: new Date(now.getTime() + nextEmail.delayDays * 86400000).toISOString(),
    status: 'active',
  }
}
```

- [ ] **Step 4: Run tests — verify pass**

Run: `npm test`
Expected: PASS (all engine tests).

- [ ] **Step 5: Commit**

```bash
git add lib/newsletter/engine.ts lib/newsletter/__tests__/engine.test.ts
git commit -m "feat(newsletter): sequence engine (enroll/due/advance) + tests"
```

---

### Task 3: Blob store (`lib/newsletter/store.ts`)

**Files:**
- Create: `lib/newsletter/store.ts`
- Reference: `lib/cms/store.ts` (kopíruj vzor verziovaného zápisu)

- [ ] **Step 1: Implement store (port from cms/store.ts)**

```ts
import { put, list, del } from '@vercel/blob'
import type { NewsletterData } from './types'
import { EMPTY_NEWSLETTER_DATA } from './types'

// Verziovaný Blob store — rovnaká filozofia ako lib/cms/store.ts.
// Zápis = nová cesta newsletter/data-<ts>.json (unikátna URL obchádza CDN cache).

const PREFIX = 'newsletter/data'
const KEEP_VERSIONS = 5

function token(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN
}

type BlobMeta = { url: string; pathname: string; uploadedAt: string | Date }

async function listVersions(t: string): Promise<BlobMeta[]> {
  const { blobs } = await list({ prefix: PREFIX, token: t })
  return (blobs as BlobMeta[]).sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
}

export async function readData(): Promise<NewsletterData> {
  const t = token()
  if (!t) return EMPTY_NEWSLETTER_DATA
  try {
    const versions = await listVersions(t)
    if (versions.length === 0) return EMPTY_NEWSLETTER_DATA
    const res = await fetch(versions[0].url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    })
    if (!res.ok) return EMPTY_NEWSLETTER_DATA
    const data = (await res.json()) as Partial<NewsletterData>
    return {
      sequences: data.sequences ?? [],
      enrollments: data.enrollments ?? [],
    }
  } catch {
    return EMPTY_NEWSLETTER_DATA
  }
}

export async function writeData(data: NewsletterData): Promise<void> {
  const t = token()
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN chýba — úložisko nie je nakonfigurované.')
  await put(`${PREFIX}-${Date.now()}.json`, JSON.stringify(data, null, 2), {
    access: 'private',
    token: t,
    addRandomSuffix: true,
    contentType: 'application/json',
  })
  try {
    const versions = await listVersions(t)
    const old = versions.slice(KEEP_VERSIONS).map((v) => v.url)
    if (old.length > 0) await del(old, { token: t })
  } catch {
    // upratovanie nesmie zhodiť zápis
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/newsletter/store.ts
git commit -m "feat(newsletter): versioned blob store"
```

---

### Task 4: Email render + Resend notify

**Files:**
- Create: `lib/newsletter/render.ts`
- Create: `lib/newsletter/notify.ts`
- Reference: `lib/members/notify.ts` (Resend vzor + HTML template)

- [ ] **Step 1: Implement render.ts**

```ts
// Branded HTML/text render jedného emailu. Vizuál ako Kruh welcome
// (lib/members/notify.ts), ale oranžový akcent #F7931A. Body je plain text.

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderEmailText(body: string): string {
  return `${body}\n\n— Dominik Žažo\n\nOdhlásiť sa: napíš mi späť na tento mail.`
}

export function renderEmailHtml(body: string, imageUrl?: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font:400 15px/1.7 Arial,sans-serif;color:#444;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('')
  const image = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="" style="width:100%;max-width:100%;border-radius:12px;margin:0 0 20px;display:block;"/>`
    : ''
  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#fafaf8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:20px;padding:36px 34px;">
        <tr><td>
          <p style="margin:0 0 20px;font:600 11px/1 Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#F7931A;">Dominik Žažo</p>
          ${image}
          ${paragraphs}
          <p style="margin:22px 0 0;font:italic 18px/1.3 Georgia,serif;color:#c67f16;">— Dominik Žažo</p>
          <p style="margin:20px 0 0;font:400 12px/1.6 Arial,sans-serif;color:#999;">Odhlásiť sa? Napíš mi späť na tento mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}
```

- [ ] **Step 2: Implement notify.ts**

```ts
import { Resend } from 'resend'
import { renderEmailHtml, renderEmailText } from './render'

const FROM =
  process.env.NEWSLETTER_FROM_EMAIL ||
  process.env.MEMBERS_FROM_EMAIL ||
  'Dominik Žažo <ahoj@dominikzazo.sk>'

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function addToNewsletterAudience(email: string, firstName?: string) {
  const resend = resendClient()
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID
  if (!resend || !audienceId || !email) return
  await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    unsubscribed: false,
    audienceId,
  })
}

export async function sendSequenceEmail(
  to: string,
  subject: string,
  body: string,
  imageUrl?: string,
): Promise<void> {
  const resend = resendClient()
  if (!resend || !to) return
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    text: renderEmailText(body),
    html: renderEmailHtml(body, imageUrl),
  })
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/newsletter/render.ts lib/newsletter/notify.ts
git commit -m "feat(newsletter): email render + resend notify"
```

---

### Task 5: Subscribe API (`app/api/newsletter/subscribe/route.ts`)

**Files:**
- Create: `app/api/newsletter/subscribe/route.ts`

Flow: honeypot → validácia → pridaj do Resend audience → enroll → ak je email #0 splatný hneď, pošli ho a advance → writeData → Discord ping.

- [ ] **Step 1: Implement route**

```ts
import { NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/newsletter/store'
import { enroll, dueEnrollments, advance } from '@/lib/newsletter/engine'
import { addToNewsletterAudience, sendSequenceEmail } from '@/lib/newsletter/notify'
import { pingDiscord } from '@/lib/members/notify'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let payload: { email?: string; firstName?: string; website?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Neplatný request.' }, { status: 400 })
  }

  // Honeypot — bot vyplnil skryté pole. Tvár sa OK, nič nerob.
  if (payload.website) return NextResponse.json({ ok: true })

  const email = (payload.email || '').trim().toLowerCase()
  const firstName = (payload.firstName || '').trim() || undefined
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Zadaj platný email.' }, { status: 400 })
  }

  try {
    await addToNewsletterAudience(email, firstName)

    const now = new Date()
    let data = enroll(await readData(), email, firstName, 'signup', now)

    // Ak sa práve vytvoril enrollment splatný hneď (email #0), pošli ho hneď
    // (welcome nečaká na cron) a posuň ho.
    const mine = data.enrollments.find((e) => e.email === email && e.status === 'active')
    if (mine && new Date(mine.nextSendAt).getTime() <= now.getTime()) {
      const seq = data.sequences.find((s) => s.id === mine.sequenceId)
      const first = seq?.emails[mine.nextEmailIndex]
      if (seq && first) {
        await sendSequenceEmail(email, first.subject, first.body, first.imageUrl)
        const advanced = advance(mine, seq, now)
        data = { ...data, enrollments: data.enrollments.map((e) => (e === mine ? advanced : e)) }
      }
    }

    await writeData(data)
    await pingDiscord(email, firstName || '')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('newsletter subscribe error', err)
    return NextResponse.json({ ok: false, error: 'Niečo sa pokazilo. Skús to znova.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Ak `pingDiscord` nie je exportované — over `lib/members/notify.ts`; je.)

- [ ] **Step 3: Manual smoke (dev server)**

Spusti dev cez preview_start (name z `.claude/launch.json`, alebo vytvor config `next dev` na porte 3000). POST:
```bash
curl -s -X POST localhost:3000/api/newsletter/subscribe -H 'Content-Type: application/json' -d '{"email":"test@example.sk","firstName":"Test"}'
```
Expected: `{"ok":true}`. Bez `RESEND_NEWSLETTER_AUDIENCE_ID`/aktívnej sekvencie = čistý no-op, stále `{"ok":true}`.

- [ ] **Step 4: Commit**

```bash
git add app/api/newsletter/subscribe/route.ts
git commit -m "feat(newsletter): subscribe API with honeypot + immediate welcome"
```

---

### Task 6: SubscribeForm komponent

**Files:**
- Create: `components/newsletter/SubscribeForm.tsx`

- [ ] **Step 1: Implement form**

```tsx
'use client'
import { useState } from 'react'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, website }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('ok')
      } else {
        setStatus('error')
        setMsg(data.error || 'Niečo sa pokazilo.')
      }
    } catch {
      setStatus('error')
      setMsg('Niečo sa pokazilo. Skús to znova.')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{ padding: '20px 0' }}>
        <p style={{ margin: 0, fontSize: 17, color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>
          Skontroluj schránku. 🤍
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666' }}>
          Práve som ti poslal prvý mail.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
      <input
        type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
        placeholder="Meno (nepovinné)" autoComplete="given-name"
        style={inputStyle}
      />
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="tvoj@email.sk" autoComplete="email"
        style={inputStyle}
      />
      {/* honeypot — skryté pred ľuďmi, boti ho vyplnia */}
      <input
        type="text" tabIndex={-1} autoComplete="off" value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        aria-hidden="true"
      />
      <button type="submit" disabled={status === 'loading'} style={btnStyle}>
        {status === 'loading' ? 'Prihlasujem…' : 'Prihlásiť sa'}
      </button>
      {status === 'error' && <p style={{ margin: 0, fontSize: 13, color: '#c0392b' }}>{msg}</p>}
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', fontSize: 15, borderRadius: 10,
  border: '1px solid #e0dcd6', background: '#fff', color: '#1a1a1a', outline: 'none',
}
const btnStyle: React.CSSProperties = {
  padding: '12px 18px', fontSize: 15, fontWeight: 500, borderRadius: 10,
  border: 'none', background: '#F7931A', color: '#fff', cursor: 'pointer',
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/newsletter/SubscribeForm.tsx
git commit -m "feat(newsletter): subscribe form component"
```

---

### Task 7: `/newsletter` stránka (capture + archív + testimonialy)

**Files:**
- Create: `app/newsletter/page.tsx`
- Reference: `app/slow-life/` alebo `app/clenska/` (layout vzor), `app/api/substack/route.ts` (archív dáta)

- [ ] **Step 1: Implement page**

Server komponent. Sekcie: (1) hero+capture, (2) archív zo Substacku, (3) testimonialy (placeholder obsah, jasne označený `{/* TODO: doplniť reálne citáty */}`).

Archív: server-side fetch RSS rovnako ako `/api/substack` route (znovupoužij logiku — buď `fetch(\`\${SITE}/api/substack\`)` z env `MEMBERS_SITE_URL` s `next: { revalidate: 3600 }`, alebo extrahuj parser do `lib/substack.ts` a volaj priamo). Preferuj priame volanie existujúceho API cez absolútnu URL v produkcii; vo vývoji fallback na prázdny zoznam ak fetch zlyhá.

Dizajn: krémové pozadie `#fafaf8`, Georgia nadpisy, Inter body, oranžový akcent `#F7931A`. Musí obsahovať `<Nav>`? Nav je viazaný na homepage SPA (`go(id)`), takže na samostatných stránkach ako `/slow-life` sa Nav nepoužíva rovnako — **pozri ako to rieši `app/slow-life/page.tsx` a `app/clenska/page.tsx`** a zopakuj ich prístup (pravdepodobne vlastný jednoduchý header/späť odkaz, nie plný SPA Nav).

Headline (spec tón): „Keby mi zajtra blokli Instagram, toto je miesto, kde ma nestratíš."
Podnadpis (2–3 vety): raw myšlienky o živote, bitcoine a tvorbe — priamo do schránky, bez algoritmu.
Archív nadpis: „Pozri si predošlé" + karty článkov (title, cover, preview, link na Substack, `target="_blank"`).
Testimonialy: „Čo hovoria iní" — 2–3 prázdne karty so štruktúrou.

`<SubscribeForm />` v hero.

Metadata export: `title`, `description`.

- [ ] **Step 2: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verify (preview)**

Otvor `/newsletter` v preview. Skontroluj: hero+form sa zobrazí, archív načíta reálne Substack články (alebo prázdny fallback bez chyby), testimonial štruktúra, žiadne console chyby, mobil OK (resize 375px).

- [ ] **Step 4: Commit**

```bash
git add app/newsletter/page.tsx
git commit -m "feat(newsletter): landing page with capture + substack archive"
```

---

### Task 8: Nav — pridať `newsletter` link

**Files:**
- Modify: `components/Nav.tsx`

- [ ] **Step 1: Add newsletter Link**

Do skupiny `<Link>` položiek (vedľa `/slow-life`, `/clenska`) pridaj odkaz na `/newsletter`. Štýl konzistentný s existujúcimi pill odkazmi. Label: `newsletter` (bez emoji, alebo s ✉ na mobile ako ostatné majú skrátenú verziu). **NEpridávaj** `/bitcoin` ani `/konzultacia` (stránky ešte neexistujú).

Vzor (uprav podľa existujúceho štýlu súboru):
```tsx
<Link
  href="/newsletter"
  className="rounded-full px-[8px] py-[3px] text-[10.5px] sm:px-[13px] sm:py-[6px] sm:text-[12px] tracking-[0.01em] transition-all duration-200 no-underline whitespace-nowrap"
  style={{
    border: '1.5px solid #e0dcd6',
    fontFamily: 'var(--font-inter), sans-serif',
    color: '#888',
    background: 'transparent',
  }}
>
  <span className="sm:hidden">✉</span>
  <span className="hidden sm:inline">✉ newsletter</span>
</Link>
```

- [ ] **Step 2: Verify typecheck + visual**

Run: `npx tsc --noEmit`; over v preview že nav ukazuje newsletter a odkaz vedie na `/newsletter`.

- [ ] **Step 3: Commit**

```bash
git add components/Nav.tsx
git commit -m "feat(nav): add newsletter link"
```

---

### Task 9: Cron route + config

**Files:**
- Create: `app/api/newsletter/cron/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Implement cron route**

```ts
import { NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/newsletter/store'
import { dueEnrollments, advance } from '@/lib/newsletter/engine'
import { sendSequenceEmail } from '@/lib/newsletter/notify'

export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get('secret') === secret
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const now = new Date()
  let data = await readData()
  const due = dueEnrollments(data, now)
  let sent = 0

  for (const enrollment of due) {
    const seq = data.sequences.find((s) => s.id === enrollment.sequenceId)
    const email = seq?.emails[enrollment.nextEmailIndex]
    if (!seq || !email) {
      // neplatný enrollment — označ done nech necyklí
      data = { ...data, enrollments: data.enrollments.map((e) => (e === enrollment ? { ...e, status: 'done' as const } : e)) }
      continue
    }
    try {
      await sendSequenceEmail(enrollment.email, email.subject, email.body, email.imageUrl)
      const advanced = advance(enrollment, seq, now)
      data = { ...data, enrollments: data.enrollments.map((e) => (e === enrollment ? advanced : e)) }
      sent++
    } catch (err) {
      console.error('cron send failed for', enrollment.email, err)
      // nechaj splatné na ďalší beh
    }
  }

  if (sent > 0) await writeData(data)
  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2: Create vercel.json cron config**

```json
{
  "crons": [{ "path": "/api/newsletter/cron", "schedule": "0 8 * * *" }]
}
```
Poznámka: Vercel automaticky pridá `Authorization: Bearer $CRON_SECRET` header pri volaní cronu ak je `CRON_SECRET` nastavené v env — takže `authorized()` prejde.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verify**

```bash
curl -s "localhost:3000/api/newsletter/cron?secret=WRONG"   # -> 401
curl -s "localhost:3000/api/newsletter/cron?secret=$CRON_SECRET"  # -> {"ok":true,"sent":N}
```
Druhé zavolanie hneď po prvom = `sent:0` (nič splatné).

- [ ] **Step 5: Commit**

```bash
git add app/api/newsletter/cron/route.ts vercel.json
git commit -m "feat(newsletter): cron scheduler for drip sends"
```

---

### Task 10: Admin CRUD API (`app/api/admin/newsletter/route.ts`)

**Files:**
- Create: `app/api/admin/newsletter/route.ts`
- Reference: `lib/members/session.ts` (`getMember`), `app/api/admin/upload/route.ts` (admin gate vzor)

- [ ] **Step 1: Implement route**

GET vracia `sequences`. PUT prijme `{ sequences }`, načíta aktuálne data, nahradí `sequences` (nechá `enrollments`), zapíše. Oboje gate `isAdmin`.

```ts
import { NextResponse } from 'next/server'
import { getMember } from '@/lib/members/session'
import { readData, writeData } from '@/lib/newsletter/store'
import type { Sequence } from '@/lib/newsletter/types'

export const runtime = 'nodejs'

async function requireAdmin() {
  const m = await getMember()
  return m.isAdmin
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const data = await readData()
  return NextResponse.json({ sequences: data.sequences })
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let body: { sequences?: Sequence[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!Array.isArray(body.sequences)) {
    return NextResponse.json({ error: 'sequences required' }, { status: 400 })
  }
  const data = await readData()
  await writeData({ ...data, sequences: body.sequences })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/newsletter/route.ts
git commit -m "feat(newsletter): admin sequences CRUD API (isAdmin gated)"
```

---

### Task 11: AI generovanie API (`app/api/admin/newsletter/generate/route.ts`)

**Files:**
- Create: `app/api/admin/newsletter/generate/route.ts`
- **REQUIRED:** Implementer MUSÍ pred písaním volať skill `claude-api` na presné model ID + SDK vzor. Predpokladaný model: `claude-sonnet-5`. NEPOUŽÍVAJ prototypový `claude-sonnet-4-6` (neexistuje).

- [ ] **Step 1: Implement route (server-side Anthropic)**

Gate `isAdmin`. Telo `{ topic, index, seqName, prevSubjects }`. System prompt = Dominikov tón (zo spec). Parsuj `PREDMET: ... --- ...`.

```ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMember } from '@/lib/members/session'

export const runtime = 'nodejs'

const SYSTEM = `Si Dominik Žažo – 22-ročný Slovák, bitcoin educator. Píšeš email do sekvencie pre odberateľov.
Tvoj štýl: ľudský, tichý, bez hype. Krátke vety. Rytmus. Žiadne "super/skvelé/úžasné".
Žiadne "som rád že si tu" ani "dúfam že sa ti páčilo". Žiadne vágne záverečné otázky.
Bitcoin = ochrana hodnoty tvojej práce, nie "number go up". Konkrétnosť nad abstrakciou.
Odpovedz PRESNE v tomto formáte a nič iné:
PREDMET: [max 8 slov]
---
[telo emailu 80–130 slov, bez oslovia ani podpisu]`

export async function POST(req: Request) {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY chýba' }, { status: 500 })

  const { topic, index, seqName, prevSubjects } = await req.json()
  const prev = Array.isArray(prevSubjects) && prevSubjects.length
    ? `\nPredošlé predmety:\n${prevSubjects.map((s: string, i: number) => `#${i + 1}: ${s}`).join('\n')}`
    : ''

  const anthropic = new Anthropic({ apiKey: key })
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-5', // implementer: over cez claude-api skill
    max_tokens: 1000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Email č.${(index ?? 0) + 1} pre sekvenciu "${seqName || ''}".\nInšpirácia: ${topic || ''}${prev}` }],
  })

  const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
  const [head, ...rest] = text.split('\n---\n')
  const subject = head.replace('PREDMET:', '').trim()
  const body = rest.join('\n---\n').trim()
  return NextResponse.json({ subject, body })
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/newsletter/generate/route.ts
git commit -m "feat(newsletter): server-side AI email generation"
```

---

### Task 12: Admin builder UI (`/admin/newsletter`)

**Files:**
- Create: `app/admin/newsletter/page.tsx`
- Create: `components/admin/newsletter/NewsletterAdmin.tsx`
- Create: `components/admin/newsletter/EmailEditor.tsx`
- Reference: `~/Downloads/email_sequence_builder.html` (prototyp — port do TSX), `components/admin/FileUploadForm.tsx` (upload obrázka vzor), `app/clenska/admin` (admin stránka gate vzor)

Port prototypu s týmito **povinnými zmenami**:
1. **Odstráň Brevo krok** z wizardu (prototyp Step3). Wizard = Základ → Emaily → Prehľad.
2. **Ukladanie do Blobu** cez `PUT /api/admin/newsletter` (nie `window.storage`). Načítanie GET pri mount.
3. **AI cez server** `POST /api/admin/newsletter/generate` (nie priamy `fetch` na api.anthropic.com; žiadny kľúč v klientovi).
4. **Obrázok k emailu** — upload cez existujúci `/api/admin/upload`, ulož vrátenú URL do `email.imageUrl`, zobraz náhľad.
5. **Trigger** select ostáva (`signup`/`purchase`/`lead_magnet`/`manual`), + `active` toggle na sekvencii (aby engine vedel ktorá je aktívna pre signup).
6. Design system tokeny (krémová, oranžová `#F7931A`) — prototyp už používa `#F7931A`, zosúlaď s CSS premennými repa kde existujú.

- [ ] **Step 1: Server page gate**

```tsx
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import NewsletterAdmin from '@/components/admin/newsletter/NewsletterAdmin'

export const metadata = { title: 'Newsletter — admin' }

export default async function Page() {
  const m = await getMember()
  if (!m.isAdmin) redirect('/')
  return <NewsletterAdmin />
}
```

- [ ] **Step 2: NewsletterAdmin.tsx (root client)**

Port prototypovej `App` + `Wizard` + zoznam/karty. Stav sekvencií načítaj z `GET /api/admin/newsletter` (`useEffect`), ukladaj cez `PUT`. Použi `Sequence`/`SequenceEmail` typy z `@/lib/newsletter/types`. `delay` → `delayDays`. Emaily majú `id` (napr. `crypto.randomUUID()`).

- [ ] **Step 3: EmailEditor.tsx**

Port prototypového `EmailEditor` + AI panel. AI volanie:
```ts
const res = await fetch('/api/admin/newsletter/generate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: aiTopic, index: idx, seqName, prevSubjects: prevEmails.map(e => e.subject) }),
})
const { subject, body } = await res.json()
```
Upload obrázka: `<input type="file">` → `POST /api/admin/upload` (FormData) → ulož URL do `imageUrl`, zobraz `<img>` náhľad + možnosť odstrániť.

- [ ] **Step 4: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verify (preview, prihlásený ako admin)**

- `/admin/newsletter` bez admin emailu → redirect na `/`.
- Ako admin: vytvor sekvenciu (názov, trigger signup, active), pridaj 2 emaily (delay 0 a 2), ulož → reload → sekvencia je tam (Blob).
- AI asistent: zadaj tému → vráti predmet + telo.
- Upload obrázka → náhľad sa zobrazí, po uložení je `imageUrl` v dátach.

- [ ] **Step 6: Commit**

```bash
git add app/admin/newsletter components/admin/newsletter
git commit -m "feat(newsletter): admin sequence builder UI (port from prototype)"
```

---

### Task 13: Env dokumentácia + setup návod

**Files:**
- Modify: `.env.local.example`
- Create: `docs/newsletter-setup.md`

- [ ] **Step 1: Add env to .env.local.example**

Pridaj sekciu:
```
# ── Newsletter systém (/newsletter, /admin/newsletter) ──────
# Samostatný Resend zoznam (Resend → Audiences → ID) — oddelený od Kruhu
RESEND_NEWSLETTER_AUDIENCE_ID=
# Odosielateľ newslettera (fallback MEMBERS_FROM_EMAIL)
NEWSLETTER_FROM_EMAIL=Dominik Žažo <ahoj@dominikzazo.sk>
# AI generovanie emailov v admine (Anthropic)
ANTHROPIC_API_KEY=
# Ochrana cron endpointu (Vercel pridá Bearer header automaticky)
CRON_SECRET=
```

- [ ] **Step 2: Write docs/newsletter-setup.md**

Krátky návod: (1) vytvor Resend Audience → vlož ID, (2) nastav ANTHROPIC_API_KEY, (3) nastav CRON_SECRET (Vercel → Settings → Environment Variables), (4) cron beží raz denne 08:00, (5) ako vytvoriť prvú sekvenciu v admine, (6) fáza 2 = vetvenie (Resend webhooky) — poznámka na budúcnosť.

- [ ] **Step 3: Commit**

```bash
git add .env.local.example docs/newsletter-setup.md
git commit -m "docs(newsletter): env + setup guide"
```

---

## Final verification (po všetkých taskoch)

- [ ] `npm test` — engine testy zelené.
- [ ] `npx tsc --noEmit` — bez chýb.
- [ ] `npm run build` — build prejde.
- [ ] E2E cez preview: subscribe → welcome; admin vytvorí sekvenciu; cron pošle splatný email a druhý beh 0.
- [ ] Gate: `/admin/newsletter` a admin API bez admina odmietnuté.
- [ ] Final code review (subagent) celej vetvy.
- [ ] `superpowers:finishing-a-development-branch`.
