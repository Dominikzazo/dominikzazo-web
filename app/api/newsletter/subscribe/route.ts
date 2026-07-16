import { NextResponse } from 'next/server'
import { sendConfirmEmail } from '@/lib/newsletter/notify'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Double opt-in: subscribe NIČ neukladá ani neenrolluje. Iba pošle potvrdzovací
// mail s podpísaným linkom. Odberateľom sa človek stáva až v /confirm.
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
    await sendConfirmEmail(email, firstName)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('newsletter subscribe error', err)
    return NextResponse.json({ ok: false, error: 'Niečo sa pokazilo. Skús to znova.' }, { status: 500 })
  }
}
