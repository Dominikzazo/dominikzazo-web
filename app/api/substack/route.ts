import { NextResponse } from 'next/server'

function get(chunk: string, tag: string): string {
  const cdata = chunk.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdata) return cdata[1].trim()
  const plain = chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return plain ? plain[1].trim() : ''
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
      const link = get(chunk, 'link') || get(chunk, 'guid')
      const title = get(chunk, 'title')
      const pubDate = get(chunk, 'pubDate')
      const description = get(chunk, 'description')
      if (title) items.push({ title, link, pubDate, description })
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
