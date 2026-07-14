import { NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/newsletter/store'
import { enroll, advance } from '@/lib/newsletter/engine'
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
