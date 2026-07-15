// Render týždenného 1·1·1 čísla „Nedeľné ticho" — PLAIN, listový štýl
// (à la Tom Noske): veta na riadok, veľa vzduchu, žiadny „dizajn" card.
// Cieľ: osobný pocit + lepšie doručenie do Primary. 1·1·1 časti sú jemne
// odlíšené labelmi, nech to nie je jednoliate.
// Osobné oslovenie: broadcast → Resend merge tag, test → konkrétne meno.

export interface Issue {
  subject: string
  intro?: string
  thought: string // 1 myšlienka
  step: string // 1 krok
  question: string // 1 otázka
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Každý riadok textu ako samostatný vzdušný odsek (Tom Noske feeling).
function lines(text: string): string {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 14px;font:400 16px/1.65 Georgia,'Times New Roman',serif;color:#2b2a27;">${esc(l)}</p>`)
    .join('')
}

function section(label: string, text: string): string {
  return `<div style="margin:0 0 26px;">
    <div style="font:600 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#a68a4f;margin:0 0 8px;">${label}</div>
    ${lines(text)}
  </div>`
}

export function renderIssueText(issue: Issue, name: string): string {
  const intro = issue.intro ? `${issue.intro}\n\n` : ''
  return `Ahoj ${name},

${intro}— 1 myšlienka —
${issue.thought}

— 1 krok —
${issue.step}

— 1 otázka —
${issue.question}

Till next Sunday,
Dominik

Odpíš mi pokojne — čítam všetko.
Odhlásiť sa: napíš mi späť na tento mail.`
}

export function renderIssueHtml(issue: Issue, nameToken: string, avatarUrl?: string): string {
  const avatar = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="Dominik Žažo" width="40" height="40" style="width:40px;height:40px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px;"/>`
    : ''
  const intro = issue.intro ? `<div style="margin:0 0 24px;">${lines(issue.intro)}</div>` : ''

  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:36px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;text-align:left;">

        <tr><td style="padding-bottom:20px;border-bottom:1px solid #eeeae2;">
          ${avatar}<span style="font:400 16px/1.3 Georgia,serif;color:#1a1a1a;vertical-align:middle;">Dominik Žažo</span>
          <span style="font:600 10px/1.3 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#b8b3a8;margin-left:8px;vertical-align:middle;">Nedeľné ticho</span>
        </td></tr>

        <tr><td style="padding-top:28px;">
          <p style="margin:0 0 22px;font:400 16px/1.65 Georgia,serif;color:#2b2a27;">Ahoj ${nameToken},</p>
          ${intro}
          ${section('1 · myšlienka', issue.thought)}
          ${section('1 · krok', issue.step)}
          ${section('1 · otázka', issue.question)}

          <p style="margin:26px 0 0;font:400 16px/1.65 Georgia,serif;color:#2b2a27;">Till next Sunday,</p>
          <p style="margin:2px 0 0;font:italic 18px/1.3 Georgia,serif;color:#b07d1e;">— Dominik</p>
        </td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0;font:400 13px/1.7 Arial,sans-serif;color:#a5a29c;">
            Odpíš mi pokojne — čítam všetko.<br/>
            Dostal si to, lebo si sa prihlásil na dominikzazo.sk. Odhlásiť sa? Stačí odpísať.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table></body></html>`
}
