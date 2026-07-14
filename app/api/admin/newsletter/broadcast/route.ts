import { NextResponse } from 'next/server'
import { getMember } from '@/lib/members/session'
import { sendTestIssue, sendBroadcastIssue } from '@/lib/newsletter/broadcast'
import type { Issue } from '@/lib/newsletter/issue'

export const runtime = 'nodejs'

function validIssue(i: unknown): i is Issue {
  if (!i || typeof i !== 'object') return false
  const o = i as Record<string, unknown>
  return (
    typeof o.subject === 'string' &&
    o.subject.trim().length > 0 &&
    typeof o.thought === 'string' &&
    typeof o.step === 'string' &&
    typeof o.question === 'string'
  )
}

export async function POST(req: Request) {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  let body: { action?: string; issue?: unknown; testEmail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  if (!validIssue(body.issue)) {
    return NextResponse.json({ ok: false, error: 'Vyplň predmet a všetky tri polia.' }, { status: 400 })
  }

  if (body.action === 'test') {
    const to = (body.testEmail || m.email || '').trim()
    if (!to) return NextResponse.json({ ok: false, error: 'Chýba testovací email.' }, { status: 400 })
    const res = await sendTestIssue(to, body.issue, m.firstName || 'Dominik')
    return NextResponse.json(res, { status: res.ok ? 200 : 502 })
  }

  if (body.action === 'send') {
    const res = await sendBroadcastIssue(body.issue)
    return NextResponse.json(res, { status: res.ok ? 200 : 502 })
  }

  return NextResponse.json({ ok: false, error: 'Neznáma akcia.' }, { status: 400 })
}
