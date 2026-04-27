import { NextResponse } from 'next/server'

function get(chunk: string, tag: string): string {
  const escTag = tag.replace(/:/g, '\\:')
  const cdata = chunk.match(new RegExp(`<${escTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escTag}>`))
  if (cdata) return cdata[1].trim()
  const plain = chunk.match(new RegExp(`<${escTag}[^>]*>([\\s\\S]*?)<\\/${escTag}>`))
  return plain ? plain[1].trim() : ''
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
}

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

export async function GET() {
  try {
    const res = await fetch('https://dominikzazo.substack.com/feed', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader/1.0)' },
    })
    if (!res.ok) throw new Error(`Feed returned ${res.status}`)
    const xml = await res.text()

    const items: object[] = []
    const re = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = re.exec(xml)) !== null) {
      const chunk = m[1]
      const title = decodeEntities(get(chunk, 'title'))
      if (!title) continue
      const link = get(chunk, 'link') || get(chunk, 'guid')
      const pubDate = get(chunk, 'pubDate')
      const description = get(chunk, 'description')
      const content = get(chunk, 'content:encoded') || description
      const preview = stripHtml(description || content).slice(0, 180)
      const cover = firstImage(content)

      items.push({ title, link, pubDate, preview, content, cover })
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
