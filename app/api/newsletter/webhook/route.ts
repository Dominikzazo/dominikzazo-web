import { Webhook } from 'svix'
import { readData, writeData } from '@/lib/newsletter/store'
import {
  mapResendEvent,
  recordEvent,
  applyBounce,
  isHardBounce,
} from '@/lib/newsletter/engagement'

export const runtime = 'nodejs'

// Resend webhook → engagement log (open/klik/bounce…). Podpis overuje Svix
// (Resend používa Svix), secret = RESEND_WEBHOOK_SECRET. Nastavenie endpointu
// v Resend dashboarde: viď docs/newsletter-setup.md.
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('newsletter webhook: RESEND_WEBHOOK_SECRET chýba')
    return new Response('not configured', { status: 500 })
  }

  const body = await req.text()
  let payload: unknown
  try {
    payload = new Webhook(secret).verify(body, {
      'svix-id': req.headers.get('svix-id') || '',
      'svix-timestamp': req.headers.get('svix-timestamp') || '',
      'svix-signature': req.headers.get('svix-signature') || '',
    })
  } catch {
    return new Response('invalid signature', { status: 401 })
  }

  const event = mapResendEvent(payload as Parameters<typeof mapResendEvent>[0])
  // Neznámy/nezaujímavý event — 200, nech Resend neretryuje.
  if (!event) return new Response('ignored', { status: 200 })

  try {
    let data = await readData()
    data = recordEvent(data, event)
    if (event.type === 'bounced' && isHardBounce(payload as Parameters<typeof isHardBounce>[0])) {
      data = applyBounce(data, event.email)
    }
    await writeData(data)
  } catch (err) {
    // 500 → Resend to skúsi znova (event nechceme stratiť).
    console.error('newsletter webhook: store update failed', err)
    return new Response('store error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
