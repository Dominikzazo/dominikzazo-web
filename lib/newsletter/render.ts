// Branded HTML/text render jedného emailu. Vizuál ako Kruh welcome
// (lib/members/notify.ts), ale oranžový akcent #F7931A. Body je plain text.

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderEmailText(body: string): string {
  return `${body}\n\n— Dominik Žažo\n\nOdhlásiť sa: napíš mi späť na tento mail.`
}

export function renderEmailHtml(body: string, imageUrl?: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font:400 15px/1.7 Arial,sans-serif;color:#444;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('')
  const image = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="" style="width:100%;max-width:100%;border-radius:12px;margin:0 0 20px;display:block;"/>`
    : ''
  return `<!doctype html><html lang="sk"><body style="margin:0;padding:0;background:#fafaf8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:20px;padding:36px 34px;">
        <tr><td>
          <p style="margin:0 0 20px;font:600 11px/1 Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#F7931A;">Dominik Žažo</p>
          ${image}
          ${paragraphs}
          <p style="margin:22px 0 0;font:italic 18px/1.3 Georgia,serif;color:#c67f16;">— Dominik Žažo</p>
          <p style="margin:20px 0 0;font:400 12px/1.6 Arial,sans-serif;color:#999;">Odhlásiť sa? Napíš mi späť na tento mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}
