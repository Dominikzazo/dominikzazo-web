import { verifyConfirm } from '@/lib/newsletter/confirm'
import { readData, writeData } from '@/lib/newsletter/store'
import { enroll, advance } from '@/lib/newsletter/engine'
import { addToNewsletterAudience, sendSequenceEmail } from '@/lib/newsletter/notify'
import { pingDiscord } from '@/lib/members/notify'

export const runtime = 'nodejs'

function page(title: string, sub: string, status = 200): Response {
  const html = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#fafaf8;color:#1a1a1a;">
  <div style="max-width:460px;margin:16vh auto 0;padding:0 24px;text-align:center;">
    <p style="font:400 26px/1.3 Georgia,serif;margin:0 0 12px;">${title}</p>
    <p style="font:400 15px/1.7 Arial,sans-serif;color:#666;margin:0;">${sub}</p>
    <p style="margin-top:28px;"><a href="https://dominikzazo.sk" style="color:#F7931A;text-decoration:none;font:400 14px/1 Arial,sans-serif;">← dominikzazo.sk</a></p>
  </div>
</body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function clientIp(req: Request): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || undefined
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = (url.searchParams.get('e') || '').trim().toLowerCase()
  const firstName = (url.searchParams.get('n') || '').trim() || undefined
  const exp = Number(url.searchParams.get('x') || '0')
  const token = url.searchParams.get('t') || ''

  const check = verifyConfirm(email, exp, token)
  if (check.expired) {
    return page(
      'Odkaz vypršal.',
      'Potvrdzovací link platí 7 dní. Prihlás sa prosím znova na dominikzazo.sk/newsletter.',
      410,
    )
  }
  if (!email || !check.ok) {
    return page('Neplatný odkaz.', 'Skús kliknúť priamo z emailu, alebo mi napíš na ahoj@dominikzazo.sk.', 400)
  }

  try {
    // 1) Pridaj do Resend audience (potvrdený súhlas)
    await addToNewsletterAudience(email, firstName)

    // 2) Enroll do drip sekvencie so záznamom súhlasu (GDPR dôkaz)
    const now = new Date()
    const before = await readData()
    let data = enroll(before, email, firstName, 'signup', now, {
      at: now.toISOString(),
      ip: clientIp(req),
    })

    // Idempotencia: ak už bol aktívny enrollment, enroll ho nevytvorí znova →
    // neposielaj welcome ani nepinguj druhýkrát.
    const isNew = data.enrollments.length > before.enrollments.length
    if (!isNew) {
      return page('Už si potvrdený. 🤍', 'Tvoje prihlásenie už platí — nič viac netreba. Prvý mail ti čoskoro príde.')
    }

    // 3) Pošli welcome (email #0) hneď a posuň enrollment
    const mine = data.enrollments.find((e) => e.email === email && e.status === 'active')
    if (mine && new Date(mine.nextSendAt).getTime() <= now.getTime()) {
      const seq = data.sequences.find((s) => s.id === mine.sequenceId)
      const first = seq?.emails[mine.nextEmailIndex]
      if (seq && first) {
        await sendSequenceEmail(email, first.subject, first.body, first.imageUrl, {
          seq: seq.id,
          idx: mine.nextEmailIndex,
        })
        const advanced = advance(mine, seq, now)
        data = { ...data, enrollments: data.enrollments.map((e) => (e === mine ? advanced : e)) }
      }
    }

    await writeData(data)
    await pingDiscord(email, firstName || '')
    return page('Potvrdené. 🤍', 'Vitaj. Prvý mail už letí k tebe. Píšem pomaly a úprimne — tak ako to tu máme radi.')
  } catch (err) {
    console.error('newsletter confirm error', err)
    return page('Niečo sa pokazilo.', 'Skús to prosím o chvíľu znova, alebo mi napíš na ahoj@dominikzazo.sk.', 500)
  }
}
