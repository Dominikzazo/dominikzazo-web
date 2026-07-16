import { Resend } from 'resend'
import { renderEmailHtml, renderEmailText } from './render'
import { unsubscribeUrl } from './unsubscribe'
import {
  confirmUrl,
  renderConfirmHtml,
  renderConfirmText,
  CONFIRM_SUBJECT,
} from './confirm'

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

// Double opt-in: pošle potvrdzovací mail. Transakčný (resend.emails.send →
// Primary tab). Bez List-Unsubscribe hlavičiek — človek ešte nie je odberateľ.
export async function sendConfirmEmail(to: string, firstName?: string): Promise<void> {
  const resend = resendClient()
  if (!resend || !to) return
  const url = confirmUrl(to, firstName)
  await resend.emails.send({
    from: FROM,
    to,
    subject: CONFIRM_SUBJECT,
    text: renderConfirmText(url, firstName),
    html: renderConfirmHtml(url, firstName),
  })
}

export async function sendSequenceEmail(
  to: string,
  subject: string,
  body: string,
  imageUrl?: string,
  ref?: { seq: string; idx: number },
): Promise<void> {
  const resend = resendClient()
  if (!resend || !to) return
  const avatar = process.env.NEWSLETTER_AVATAR_URL || undefined
  const unsub = unsubscribeUrl(to)
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    text: renderEmailText(body, unsub),
    html: renderEmailHtml(body, imageUrl, avatar, unsub),
    headers: {
      'List-Unsubscribe': `<${unsub}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    // Tagy sa vracajú vo webhook payloade → vieme open/klik priradiť ku
    // konkrétnemu mailu sekvencie (viď lib/newsletter/engagement.ts).
    ...(ref
      ? {
          tags: [
            { name: 'source', value: 'drip' },
            { name: 'seq', value: ref.seq },
            { name: 'idx', value: String(ref.idx) },
          ],
        }
      : {}),
  })
}
