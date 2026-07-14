// Render týždenného 1·1·1 čísla „Nedeľné ticho" do prémiového emailu.
// Osobné oslovenie: pri broadcaste `nameToken` = Resend merge tag
// (napr. {{{FIRST_NAME|priateľ}}}), pri teste = konkrétne meno.

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

function para(text: string, extra = ''): string {
  return `<p style="margin:0${extra};font:400 16px/1.75 Georgia,'Times New Roman',serif;color:#2b2a27;">${esc(text).replace(/\n/g, '<br/>')}</p>`
}

function block(n: string, label: string, text: string): string {
  return `<tr><td style="padding:0 0 22px;">
    <div style="font:600 10px/1.4 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#F7931A;">${n} · ${label}</div>
    ${para(text, ';margin-top:6px')}
  </td></tr>`
}

export function renderIssueText(issue: Issue, name: string): string {
  const intro = issue.intro ? `${issue.intro}\n\n` : ''
  return `Ahoj ${name},

${intro}1 · MYŠLIENKA
${issue.thought}

1 · KROK
${issue.step}

1 · OTÁZKA
${issue.question}

—
Dominik Žažo
Vedomý kút internetu · dominikzazo.sk

Odhlásiť sa: napíš mi späť na tento mail.`
}

export function renderIssueHtml(issue: Issue, nameToken: string, avatarUrl?: string): string {
  const avatar = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="Dominik Žažo" width="44" height="44" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;margin-right:12px;"/>`
    : ''
  const intro = issue.intro ? `<tr><td style="padding:0 0 22px;">${para(issue.intro)}</td></tr>` : ''

  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid rgba(0,0,0,0.05);border-radius:22px;box-shadow:0 10px 40px rgba(0,0,0,0.05);">

        <tr><td style="padding:44px 44px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">${avatar}</td>
            <td style="vertical-align:middle;">
              <div style="font:400 17px/1.2 Georgia,serif;color:#1a1a1a;">Dominik Žažo</div>
              <div style="font:600 10px/1.4 Arial,sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:#c08a2d;margin-top:3px;">Nedeľné ticho</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:22px 44px 0;">
          <div style="height:1px;background:linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0));"></div>
        </td></tr>

        <tr><td style="padding:30px 44px 8px;">
          ${para(`Ahoj ${nameToken},`, ';margin-bottom:20px')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${intro}
            ${block('1', 'myšlienka', issue.thought)}
            ${block('1', 'krok', issue.step)}
            ${block('1', 'otázka', issue.question)}
          </table>
        </td></tr>

        <tr><td style="padding:6px 44px 40px;">
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
