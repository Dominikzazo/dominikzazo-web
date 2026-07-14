// Branded HTML/text render jedného emailu — prémiový, tichý, s priestorom
// na dýchanie. Vizuál v duchu dominikzazo.sk: krémová, serif signature,
// veľa bieleho priestoru hore. `body` je plain text (veta/riadok).

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderEmailText(body: string): string {
  return `${body}\n\n—\nDominik Žažo\nVedomý kút internetu · dominikzazo.sk\n\nOdhlásiť sa: napíš mi späť na tento mail.`
}

/**
 * @param body plain text (odseky oddelené prázdnym riadkom, riadky = <br/>)
 * @param imageUrl voliteľný obrázok v tele
 * @param avatarUrl voliteľná Dominikova fotka do hlavičky (signature)
 */
export function renderEmailHtml(body: string, imageUrl?: string, avatarUrl?: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 20px;font:400 16px/1.75 Georgia,'Times New Roman',serif;color:#2b2a27;">${esc(p).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')

  const bodyImage = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="" style="width:100%;max-width:100%;border-radius:14px;margin:8px 0 26px;display:block;"/>`
    : ''

  const avatar = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="Dominik Žažo" width="44" height="44" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;margin-right:12px;"/>`
    : ''

  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid rgba(0,0,0,0.05);border-radius:22px;box-shadow:0 10px 40px rgba(0,0,0,0.05);">

        <!-- hlavička: priestor na dýchanie + signature -->
        <tr><td style="padding:44px 44px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">${avatar}</td>
            <td style="vertical-align:middle;">
              <div style="font:400 17px/1.2 Georgia,serif;color:#1a1a1a;">Dominik Žažo</div>
              <div style="font:600 10px/1.4 Arial,sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:#c08a2d;margin-top:3px;">Vedomý kút internetu</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- jemná linka pod hlavičkou -->
        <tr><td style="padding:22px 44px 0;">
          <div style="height:1px;background:linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0));"></div>
        </td></tr>

        <!-- telo -->
        <tr><td style="padding:30px 44px 8px;">
          ${bodyImage}
          ${paragraphs}
        </td></tr>

        <!-- podpis -->
        <tr><td style="padding:14px 44px 40px;">
          <div style="height:1px;background:rgba(0,0,0,0.06);margin:0 0 22px;"></div>
          <p style="margin:0;font:italic 20px/1.3 Georgia,serif;color:#b07d1e;">— Dominik</p>
          <p style="margin:16px 0 0;font:400 12px/1.7 Arial,sans-serif;color:#a5a29c;">
            Dostal si to, lebo si sa prihlásil na dominikzazo.sk.<br/>
            Odhlásiť sa? Stačí odpísať na tento mail.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table></body></html>`
}
