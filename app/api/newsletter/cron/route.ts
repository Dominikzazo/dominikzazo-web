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
  let changed = false

  for (const enrollment of due) {
    const seq = data.sequences.find((s) => s.id === enrollment.sequenceId)
    const email = seq?.emails[enrollment.nextEmailIndex]
    if (!seq || !email) {
      // neplatný enrollment (zmazaná sekvencia) — označ done nech necyklí
      data = {
        ...data,
        enrollments: data.enrollments.map((e) =>
          e === enrollment ? { ...e, status: 'done' as const } : e,
        ),
      }
      changed = true
      continue
    }
    try {
      await sendSequenceEmail(enrollment.email, email.subject, email.body, email.imageUrl, {
        seq: seq.id,
        idx: enrollment.nextEmailIndex,
      })
      const advanced = advance(enrollment, seq, now)
      data = {
        ...data,
        enrollments: data.enrollments.map((e) => (e === enrollment ? advanced : e)),
      }
      sent++
      changed = true
    } catch (err) {
      console.error('cron send failed for', enrollment.email, err)
      // nechaj splatné na ďalší beh
    }
  }

  if (changed) await writeData(data)
  return NextResponse.json({ ok: true, sent })
}
