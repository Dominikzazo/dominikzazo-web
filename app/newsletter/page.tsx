import type { Metadata } from 'next'
import Link from 'next/link'
import SubscribeForm from '@/components/newsletter/SubscribeForm'

export const metadata: Metadata = {
  title: 'Newsletter · Dominik Žažo',
  description:
    'Keby mi zajtra blokli Instagram, toto je miesto, kde ma nestratíš. Raw myšlienky o živote, bitcoine a tvorbe — priamo do schránky.',
}

// Newsletter beží na vlastnom Resend zozname. Archív ukazuje reálne Substack
// články (proof of work), kým migrácia obsahu neprebehne.

interface ArchiveItem {
  title: string
  link: string
  cover: string | null
  preview: string
}

function get(chunk: string, tag: string): string {
  const escTag = tag.replace(/:/g, '\\:')
  const cdata = chunk.match(new RegExp(`<${escTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escTag}>`))
  if (cdata) return cdata[1].trim()
  const plain = chunk.match(new RegExp(`<${escTag}[^>]*>([\\s\\S]*?)<\\/${escTag}>`))
  return plain ? plain[1].trim() : ''
}

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function strip(html: string): string {
  return decode(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
}

async function getArchive(): Promise<ArchiveItem[]> {
  try {
    const res = await fetch('https://dominikzazo.substack.com/feed', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader/1.0)' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items: ArchiveItem[] = []
    const re = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = re.exec(xml)) !== null && items.length < 6) {
      const chunk = m[1]
      const title = decode(get(chunk, 'title'))
      if (!title) continue
      const link = get(chunk, 'link') || get(chunk, 'guid')
      const content = get(chunk, 'content:encoded') || get(chunk, 'description')
      const coverMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
      items.push({
        title,
        link,
        cover: coverMatch ? coverMatch[1] : null,
        preview: strip(get(chunk, 'description') || content).slice(0, 140),
      })
    }
    return items
  } catch {
    return []
  }
}

export default async function NewsletterPage() {
  const archive = await getArchive()

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] page-pad flex flex-col items-center">
      {/* top bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a] transition-colors no-underline"
        >
          ← domov
        </Link>
      </div>

      {/* hero + capture */}
      <section className="w-full max-w-2xl">
        <p className="m-0 mb-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#F7931A]">
          Newsletter
        </p>
        <h1 className="font-lora text-[30px] sm:text-[38px] leading-[1.2] m-0 mb-5 text-[#1a1a1a]">
          Keby mi zajtra blokli Instagram, toto je miesto, kde ma nestratíš.
        </h1>
        <p className="text-[16px] leading-[1.7] text-[#555] m-0 mb-2 max-w-[560px]">
          Raw myšlienky o živote, bitcoine a tvorbe — priamo do tvojej schránky. Bez
          algoritmu, bez filtra. Pomaly, ako to tu máme radi.
        </p>
        <p className="text-[16px] leading-[1.7] text-[#555] m-0 mb-8 max-w-[560px]">
          Žiadny spam. Kedykoľvek sa odhlásiš jedným kliknutím.
        </p>
        <SubscribeForm />
      </section>

      {/* archív — proof of work zo Substacku */}
      {archive.length > 0 && (
        <section className="w-full max-w-2xl mt-20">
          <h2 className="font-lora text-[22px] m-0 mb-1 text-[#1a1a1a]">Pozri si predošlé</h2>
          <p className="text-[14px] text-[#888] m-0 mb-7">
            Ukážka toho, čo posielam. Staršie kúsky sú zatiaľ na Substacku.
          </p>
          <div className="flex flex-col gap-3">
            {archive.map((item) => (
              <a
                key={item.link}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="group flex gap-4 items-center rounded-2xl border border-black/[0.07] bg-white p-3 sm:p-4 no-underline transition-colors hover:border-[#F7931A]/40"
              >
                {item.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover}
                    alt=""
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="m-0 text-[15px] font-medium text-[#1a1a1a] leading-snug">
                    {item.title}
                  </p>
                  {item.preview && (
                    <p className="m-0 mt-1 text-[13px] text-[#888] line-clamp-2">{item.preview}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* sociálny dôkaz — štruktúra, obsah doplní Dominik */}
      <section className="w-full max-w-2xl mt-20 mb-10">
        <h2 className="font-lora text-[22px] m-0 mb-7 text-[#1a1a1a]">Čo hovoria iní</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* TODO: doplniť reálne citáty odberateľov */}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-dashed border-black/[0.12] bg-white/60 p-5"
            >
              <p className="m-0 text-[14px] leading-[1.6] text-[#aaa] italic">
                „Miesto na citát odberateľa."
              </p>
              <p className="m-0 mt-3 text-[12px] text-[#bbb]">— meno</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
