// Render jedného (drip) emailu — PLAIN, listový štýl (à la Tom Noske):
// veta na riadok, veľa vzduchu, žiadny „dizajn" card. Osobné + lepšie Primary.
// `body` je plain text (riadky = vzdušné odseky).

import { footerHtml, footerText } from './footer'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function lines(text: string): string {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 15px;font:400 16px/1.65 Georgia,'Times New Roman',serif;color:#2b2a27;">${esc(l)}</p>`)
    .join('')
}

export function renderEmailText(body: string, unsubscribeUrl?: string): string {
  return `${body}\n\n— Dominik\n\n${footerText(unsubscribeUrl)}`
}

export function renderEmailHtml(
  body: string,
  imageUrl?: string,
  avatarUrl?: string,
  unsubscribeUrl?: string,
): string {
  const avatar = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="Dominik Žažo" width="40" height="40" style="width:40px;height:40px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px;"/>`
    : ''
  const image = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="" style="width:100%;max-width:100%;border-radius:10px;margin:6px 0 20px;display:block;"/>`
    : ''

  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:36px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;text-align:left;">

        <tr><td style="padding-bottom:20px;border-bottom:1px solid #eeeae2;">
          ${avatar}<span style="font:400 16px/1.3 Georgia,serif;color:#1a1a1a;vertical-align:middle;">Dominik Žažo</span>
        </td></tr>

        <tr><td style="padding-top:28px;">
          ${image}
          ${lines(body)}
          <p style="margin:24px 0 0;font:italic 18px/1.3 Georgia,serif;color:#b07d1e;">— Dominik</p>
        </td></tr>

        <tr><td style="padding:32px 0 0;">
          ${footerHtml(unsubscribeUrl)}
        </td></tr>

      </table>
    </td></tr>
  </table></body></html>`
}
