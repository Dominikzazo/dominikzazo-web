import crypto from 'node:crypto'

// Double opt-in potvrdzovací link. Token = HMAC(email + exp) s prefixom
// "confirm:" — účelovo oddelený od unsub tokenu (unsub link nepotvrdí a naopak).
// exp (unix ms) je v URL v čistom, token ho podpisuje → nedá sa predĺžiť
// expirácia ani podvrhnúť cudzí e-mail bez CRON_SECRET. Secret = CRON_SECRET.

const SITE = process.env.MEMBERS_SITE_URL || 'https://dominikzazo.sk'
const TTL_MS = 7 * 86400000 // link platí 7 dní

function secret(): string {
  return process.env.CRON_SECRET || 'dev-secret'
}

export function confirmToken(email: string, exp: number): string {
  return crypto
    .createHmac('sha256', secret())
    .update(`confirm:${email.trim().toLowerCase()}:${exp}`)
    .digest('hex')
    .slice(0, 32)
}

export function verifyConfirm(
  email: string,
  exp: number,
  token: string,
): { ok: boolean; expired: boolean } {
  const expected = confirmToken(email, exp)
  let signed = false
  if (token && token.length === expected.length) {
    try {
      signed = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    } catch {
      signed = false
    }
  }
  if (!signed) return { ok: false, expired: false }
  if (exp <= Date.now()) return { ok: false, expired: true }
  return { ok: true, expired: false }
}

export function confirmUrl(email: string, firstName?: string): string {
  const exp = Date.now() + TTL_MS
  const params = new URLSearchParams({
    e: email.trim().toLowerCase(),
    x: String(exp),
    t: confirmToken(email, exp),
  })
  if (firstName) params.set('n', firstName)
  return `${SITE}/api/newsletter/confirm?${params.toString()}`
}

export const CONFIRM_SUBJECT = 'Ešte jeden klik 🤍'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Confirm mail — plain listový štýl (ako render.ts), ale s jedným CTA tlačidlom.
// Krátky, teplý, v Dominikovom tóne. Bez unsubscribe pätičky — človek ešte nie
// je odberateľ, len potvrdzuje.
export function renderConfirmText(url: string, firstName?: string): string {
  const hi = firstName ? `Ahoj ${firstName},` : 'Ahoj,'
  return `${hi}

ešte krok a sme v kontakte.

Klikni a potvrď, že tieto maily naozaj chceš odo mňa dostávať:
${url}

Kým to nepotvrdíš, neposielam ti nič. Tak to má byť.

Ak si sa neprihlásil ty, len tento mail ignoruj — nič sa nestane.

— Dominik`
}

export function renderConfirmHtml(url: string, firstName?: string): string {
  const hi = firstName ? `Ahoj ${esc(firstName)},` : 'Ahoj,'
  const p = (t: string) =>
    `<p style="margin:0 0 15px;font:400 16px/1.65 Georgia,'Times New Roman',serif;color:#2b2a27;">${t}</p>`
  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:36px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;text-align:left;">

        <tr><td style="padding-bottom:20px;border-bottom:1px solid #eeeae2;">
          <span style="font:400 16px/1.3 Georgia,serif;color:#1a1a1a;">Dominik Žažo</span>
        </td></tr>

        <tr><td style="padding-top:28px;">
          ${p(hi)}
          ${p('ešte krok a sme v kontakte.')}
          ${p('Klikni nižšie a potvrď, že tieto maily naozaj chceš odo mňa dostávať.')}

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 26px;">
            <tr><td style="border-radius:10px;background:#F7931A;">
              <a href="${esc(url)}" style="display:inline-block;padding:13px 26px;font:500 15px/1 Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:10px;">Potvrdiť prihlásenie →</a>
            </td></tr>
          </table>

          ${p('Kým to nepotvrdíš, neposielam ti nič. Tak to má byť.')}
          <p style="margin:20px 0 0;font:400 13px/1.7 Arial,sans-serif;color:#a5a29c;">Ak si sa neprihlásil ty, len tento mail ignoruj — nič sa nestane.<br/>Nejde tlačidlo? Skopíruj si tento odkaz: <a href="${esc(url)}" style="color:#a5a29c;">${esc(url)}</a></p>
          <p style="margin:24px 0 0;font:italic 18px/1.3 Georgia,serif;color:#b07d1e;">— Dominik</p>
        </td></tr>

      </table>
    </td></tr>
  </table></body></html>`
}
