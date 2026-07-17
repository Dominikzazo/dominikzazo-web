import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getMember } from '@/lib/members/session'
import { readData } from '@/lib/newsletter/store'
import { classifyEmail } from '@/lib/newsletter/history'

export const runtime = 'nodejs'

// História odoslaných mailov. Zdroj je Resend, nie naše dáta — Resend má
// kompletný záznam každého odoslania (aj tých spred tohto systému), my nie.
// Pozn.: API kľúč je účtový, takže /emails vracia aj bitcoinovaskola.sk —
// filtrujeme na newsletter doménu.
const NEWSLETTER_DOMAIN = '@dominikzazo.sk'

export async function GET() {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'Resend nie je nakonfigurovaný.' }, { status: 500 })

  const resend = new Resend(key)

  try {
    const [emailsRes, broadcastsRes, data] = await Promise.all([
      resend.emails.list(),
      resend.broadcasts.list(),
      readData(),
    ])

    if (emailsRes.error) throw new Error(emailsRes.error.message)
    if (broadcastsRes.error) throw new Error(broadcastsRes.error.message)

    // Kontext na určenie typu mailu (Resend v zozname tags nevracia).
    const ctx = {
      sequenceSubjects: data.sequences.flatMap((s) => s.emails.map((e) => e.subject)),
      broadcastNames: (broadcastsRes.data?.data ?? []).map((b) => b.name || ''),
    }

    const emails = (emailsRes.data?.data ?? [])
      .filter((e) => (e.from || '').includes(NEWSLETTER_DOMAIN))
      .map((e) => ({
        id: e.id,
        subject: e.subject || '(bez predmetu)',
        to: e.to?.[0] || '',
        createdAt: e.created_at,
        lastEvent: e.last_event || 'sent',
        kind: classifyEmail(e.subject || '', ctx),
      }))

    const broadcasts = (broadcastsRes.data?.data ?? [])
      .filter((b) => b.status === 'sent')
      .map((b) => ({
        id: b.id,
        name: b.name || '(bez názvu)',
        sentAt: b.sent_at,
      }))

    return NextResponse.json({ emails, broadcasts })
  } catch (err) {
    console.error('newsletter history error', err)
    return NextResponse.json({ error: 'Nepodarilo sa načítať históriu.' }, { status: 502 })
  }
}
