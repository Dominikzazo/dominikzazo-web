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
  const avatar = process.env.NEWSLETTER_AVATAR_URL || undefined
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    text: renderEmailText(body),
    html: renderEmailHtml(body, imageUrl, avatar),
  })
}
