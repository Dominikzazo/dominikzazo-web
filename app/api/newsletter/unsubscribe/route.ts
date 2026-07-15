import { Resend } from 'resend'
import { verifyUnsub } from '@/lib/newsletter/unsubscribe'
import { readData, writeData } from '@/lib/newsletter/store'

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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = (url.searchParams.get('e') || '').trim().toLowerCase()
  const token = url.searchParams.get('t') || ''

  if (!email || !verifyUnsub(email, token)) {
    return page('Neplatný odkaz.', 'Skús kliknúť priamo z emailu, alebo mi napíš na ahoj@dominikzazo.sk.', 400)
  }

  // 1) Resend kontakt → unsubscribed
  try {
    const key = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID
    if (key && audienceId) {
      await new Resend(key).contacts.update({ email, audienceId, unsubscribed: true })
    }
  } catch (err) {
    console.error('unsubscribe: resend update failed', err)
  }

  // 2) Naše enrollmenty → status unsubscribed (zastaví drip)
  try {
    const data = await readData()
    const enrollments = data.enrollments.map((e) =>
      e.email.trim().toLowerCase() === email ? { ...e, status: 'unsubscribed' as const } : e,
    )
    await writeData({ ...data, enrollments })
  } catch (err) {
    console.error('unsubscribe: store update failed', err)
  }

  return page('Odhlásený. 🤍', 'Mrzí ma, že odchádzaš. Kedykoľvek sa môžeš vrátiť. — Dominik')
}
