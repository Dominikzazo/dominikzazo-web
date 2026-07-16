// Zdieľaná GDPR-friendly pätička emailu: priamy unsubscribe link,
// identita odosielateľa, dôvod doručenia (+ voliteľná poštová adresa cez env).
// Pri broadcaste je unsubUrl = Resend merge tag {{{RESEND_UNSUBSCRIBE_URL}}}.

const POSTAL = process.env.NEWSLETTER_POSTAL_ADDRESS || ''

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function footerHtml(unsubUrl?: string): string {
  const unsub = unsubUrl
    ? `<a href="${esc(unsubUrl)}" style="color:#8f8b82;text-decoration:underline;">Odhlásiť sa</a>`
    : 'Odhlásiť sa? Stačí odpísať na tento mail.'
  return `<p style="margin:0;font:400 13px/1.7 Arial,sans-serif;color:#a5a29c;">
      Odpíš mi pokojne — čítam všetko.<br/>
      Dostal si tento email, lebo si sa prihlásil na <a href="https://dominikzazo.sk" style="color:#a5a29c;text-decoration:underline;">dominikzazo.sk</a>. ${unsub}<br/>
      Dominik Žažo${POSTAL ? ` · ${esc(POSTAL)}` : ''}
    </p>`
}

export function footerText(unsubUrl?: string): string {
  const unsub = unsubUrl ? `\nOdhlásiť sa: ${unsubUrl}` : '\nOdhlásiť sa: napíš mi späť na tento mail.'
  return `Odpíš mi pokojne — čítam všetko.\nDominik Žažo · dominikzazo.sk${POSTAL ? ` · ${POSTAL}` : ''}${unsub}`
}
