// Odkazy v tele mailu. Telo píše Dominik ako plain text, takže podporujeme:
//   [text](https://…)  → hypertextový odkaz na texte (preferované)
//   https://…          → automaticky klikateľné
// Bez tohto by v HTML nevznikol žiadny <a href>, Gmail by si URL sklikateľnil
// až u príjemcu — a Resend by nemal čo sledovať (vie prepísať len reálne <a>).

const LINK_STYLE = 'color:#b07d1e;text-decoration:underline;'

// Markdown [text](url) alebo holá http(s) URL.
// Koncová interpunkcia (.,!?…) sa do URL nepočíta — inak by veta zožrala bodku.
const PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>"']+[^\s<>"'.,!?;:)])/g

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Len http(s). Bráni javascript:/data: odkazom v tele mailu.
function safeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function anchor(url: string, text: string): string {
  return `<a href="${esc(url)}" style="${LINK_STYLE}">${esc(text)}</a>`
}

export function linkifyHtml(line: string): string {
  let out = ''
  let last = 0
  for (const m of line.matchAll(PATTERN)) {
    const [full, mdText, mdUrl, bareUrl] = m
    const at = m.index ?? 0
    out += esc(line.slice(last, at))

    if (bareUrl) {
      out += anchor(bareUrl, bareUrl)
    } else if (mdUrl && safeUrl(mdUrl)) {
      out += anchor(mdUrl, mdText)
    } else {
      // nepodporovaná schéma (javascript:…) — zahoď odkaz, nechaj holý text
      out += esc(mdText ?? full)
    }
    last = at + full.length
  }
  out += esc(line.slice(last))
  return out
}

// Textová verzia mailu — anchor sa nedá, tak markdown rozbalíme na „text: url".
export function linkifyText(line: string): string {
  return line.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (full, text: string, url: string) =>
    safeUrl(url) ? `${text}: ${url}` : text,
  )
}
