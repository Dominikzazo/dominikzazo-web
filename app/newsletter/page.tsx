import type { Metadata } from 'next'
import Link from 'next/link'
import SubscribeForm from '@/components/newsletter/SubscribeForm'

export const metadata: Metadata = {
  title: 'Newsletter · Dominik Žažo',
  description:
    'Nedeľné ticho — každú nedeľu jedna myšlienka, jeden malý krok, jedna otázka. O živote, spomalení a vedomom bytí. Priamo do schránky.',
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
    while ((m = re.exec(xml)) !== null && items.length < 4) {
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
        preview: strip(get(chunk, 'description') || content).slice(0, 130),
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
          Nedeľné ticho · newsletter
        </p>
        <h1 className="font-lora text-[30px] sm:text-[38px] leading-[1.2] m-0 mb-5 text-[#1a1a1a]">
          Keby mi zajtra blokli Instagram, toto je miesto, kde ma nestratíš.
        </h1>
        <p className="text-[16px] leading-[1.7] text-[#555] m-0 mb-8 max-w-[560px]">
          Každú nedeľu ti pošlem jeden krátky list. O živote, spomalení a tom, ako si
          udržať to, na čom ti záleží. Bez algoritmu, bez filtra. Za dve minúty čítania.
        </p>
        <SubscribeForm />
      </section>

      {/* čo môžeš čakať — 1·1·1 */}
      <section className="w-full max-w-2xl mt-20">
        <h2 className="font-lora text-[22px] m-0 mb-2 text-[#1a1a1a]">Čo príde do schránky</h2>
        <p className="text-[14px] text-[#888] m-0 mb-7 max-w-[520px]">
          Jednoduchý rituál. Každú nedeľu to isté — nič naviac, nič na scrollovanie.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: '1', t: 'myšlienka', d: 'Niečo, čo mi tento týždeň došlo. Krátko, úprimne.' },
            { n: '1', t: 'malý krok', d: 'Jedna konkrétna vec, čo môžeš tento týždeň skúsiť.' },
            { n: '1', t: 'otázka', d: 'Jedna otázka do ticha. Pre teba, nie pre algoritmus.' },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-black/[0.07] bg-white p-5">
              <div className="font-lora text-[26px] text-[#F7931A] leading-none">{x.n}</div>
              <div className="mt-2 text-[14px] font-medium text-[#1a1a1a]">{x.t}</div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-[#888] m-0">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ukážka emailu */}
      <section className="w-full max-w-2xl mt-20">
        <h2 className="font-lora text-[22px] m-0 mb-2 text-[#1a1a1a]">Ako to vyzerá</h2>
        <p className="text-[14px] text-[#888] m-0 mb-7">Malá ukážka jedného čísla.</p>
        <div
          className="rounded-[20px] bg-white p-6 sm:p-8"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}
        >
          <div className="font-lora text-[16px] text-[#1a1a1a]">Dominik Žažo</div>
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#c08a2d] mt-1">
            Vedomý kút internetu
          </div>
          <div className="h-px bg-black/[0.06] my-5" />
          <p className="font-lora text-[16px] leading-[1.7] text-[#2b2a27] m-0">Ahoj Peter,</p>
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F7931A]">
                1 · myšlienka
              </div>
              <p className="font-lora text-[15px] leading-[1.7] text-[#2b2a27] m-0 mt-1">
                Ticho nie je prázdno. Je to priestor, kde konečne počuješ seba.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F7931A]">
                1 · krok
              </div>
              <p className="font-lora text-[15px] leading-[1.7] text-[#2b2a27] m-0 mt-1">
                Tento týždeň: jedno ráno bez telefónu, kým nedopiješ prvú kávu.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F7931A]">
                1 · otázka
              </div>
              <p className="font-lora text-[15px] leading-[1.7] text-[#2b2a27] m-0 mt-1">
                Čo by si dnes robil inak, keby ťa nikto nesledoval?
              </p>
            </div>
          </div>
          <p className="font-lora italic text-[17px] text-[#b07d1e] mt-6 m-0">— Dominik</p>
        </div>
      </section>

      {/* proof of work — predošlé články */}
      {archive.length > 0 && (
        <section className="w-full max-w-2xl mt-20 mb-8">
          <h2 className="font-lora text-[22px] m-0 mb-2 text-[#1a1a1a]">Nechce sa ti (ešte) prihlásiť?</h2>
          <p className="text-[14px] text-[#888] m-0 mb-7 max-w-[520px]">
            V pohode. Prečítaj si najprv, čo som už písal — nech vieš, do čoho ideš.
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
    </main>
  )
}
