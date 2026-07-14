import { Resend } from 'resend'
import { renderIssueHtml, renderIssueText, type Issue } from './issue'

const FROM =
  process.env.NEWSLETTER_FROM_EMAIL ||
  process.env.MEMBERS_FROM_EMAIL ||
  'Dominik Žažo <ahoj@dominikzazo.sk>'

// Resend merge tag pre krstné meno s jemným fallbackom.
const NAME_MERGE = '{{{FIRST_NAME|priateľ}}}'

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

/** Test — pošle číslo na jednu adresu (bez merge tagov, meno dosadí priamo). */
export async function sendTestIssue(
  to: string,
  issue: Issue,
  name = 'Dominik',
): Promise<{ ok: boolean; error?: string }> {
  const resend = resendClient()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY chýba.' }
  const avatar = process.env.NEWSLETTER_AVATAR_URL || undefined
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[TEST] ${issue.subject}`,
    html: renderIssueHtml(issue, name, avatar),
    text: renderIssueText(issue, name),
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Ostré — vytvorí a hneď pošle broadcast celej Newsletter audience s oslovením menom. */
export async function sendBroadcastIssue(
  issue: Issue,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = resendClient()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY chýba.' }
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID
  if (!audienceId) return { ok: false, error: 'RESEND_NEWSLETTER_AUDIENCE_ID chýba.' }

  const avatar = process.env.NEWSLETTER_AVATAR_URL || undefined
  const { data, error } = await resend.broadcasts.create({
    audienceId,
    from: FROM,
    subject: issue.subject,
    name: `Nedeľné ticho — ${issue.subject}`,
    html: renderIssueHtml(issue, NAME_MERGE, avatar),
    text: renderIssueText(issue, NAME_MERGE),
    send: true,
  })
  return error ? { ok: false, error: error.message } : { ok: true, id: data?.id }
}
