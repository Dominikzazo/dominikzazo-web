import { Resend } from 'resend'

/**
 * Notifikačná vrstva pre členskú sekciu. Volaná z webhooku po user.created.
 * Každá funkcia je no-op ak chýba jej env (nespadne, len preskočí).
 * Toto je Dominik Žažo brand — nič spoločné s bitcoinovaskola.sk.
 */

const FROM = process.env.MEMBERS_FROM_EMAIL || 'Dominik Žažo <ahoj@dominikzazo.sk>'
const SITE = process.env.MEMBERS_SITE_URL || 'https://dominikzazo.sk'

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const resend = resendClient()
  if (!resend || !email) return

  const meno = firstName ? ` ${firstName}` : ''
  const obsahUrl = `${SITE}/clenska/obsah`

  const text = `Ahoj${meno},

ďakujem, že si tu. Práve si sa dostal do tichšieho kúta môjho internetu —
miesta, kde idem pomalšie a hlbšie než kdekoľvek inde.

Zatiaľ tam nájdeš pár vecí, čoskoro pribudne viac: eseje, ktoré nedávam von,
a materiály na spomalenie.

Kedykoľvek sa vráť: ${obsahUrl}

Pokojne mi odpíš rovno na tento mail, čítam všetko.

— Dominik Žažo`

  const html = `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#fafaf8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:20px;padding:40px 36px;">
        <tr><td>
          <p style="margin:0 0 20px;font:600 11px/1 Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#a8843f;">&#10022; Kruh</p>
          <h1 style="margin:0 0 18px;font:400 26px/1.25 Georgia,serif;color:#1a1a1a;">Ahoj${meno}, si dnu.</h1>
          <p style="margin:0 0 16px;font:400 15px/1.7 Arial,sans-serif;color:#444;">ďakujem, že si tu. Práve si sa dostal do tichšieho kúta môjho internetu — miesta, kde idem pomalšie a hlbšie než kdekoľvek inde.</p>
          <p style="margin:0 0 28px;font:400 15px/1.7 Arial,sans-serif;color:#444;">Zatiaľ tam nájdeš pár vecí, čoskoro pribudne viac: eseje, ktoré nedávam von, a materiály na spomalenie.</p>
          <a href="${obsahUrl}" style="display:inline-block;background:#c9a96e;color:#1a1a1a;text-decoration:none;font:600 14px/1 Arial,sans-serif;padding:14px 28px;border-radius:999px;">Vstúpiť do obsahu &rarr;</a>
          <p style="margin:28px 0 0;font:400 14px/1.7 Arial,sans-serif;color:#666;">Pokojne mi odpíš rovno na tento mail, čítam všetko.</p>
          <p style="margin:20px 0 0;font:italic 18px/1.3 Georgia,serif;color:#9a8358;">— Dominik Žažo</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`

  await resend.emails.send({ from: FROM, to: email, subject: 'Si dnu 🤍', text, html })
}

export async function addToResendAudience(email: string, firstName: string) {
  const resend = resendClient()
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!resend || !audienceId || !email) return

  await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    unsubscribed: false,
    audienceId,
  })
}

export async function pingDiscord(email: string, firstName: string) {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url || !email) return

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🤍 Nový člen na dominikzazo.sk: **${email}**${firstName ? ` (${firstName})` : ''}`,
    }),
  })
}
