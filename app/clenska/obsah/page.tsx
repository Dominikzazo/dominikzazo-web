import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'
import { listCategories, listItems } from '@/lib/cms/premium'
import type { PremiumItem } from '@/lib/cms/types'

export const metadata = { title: 'Kruh · obsah · Dominik Žažo' }

const TYPE_META: Record<PremiumItem['type'], { icon: string; label: string }> = {
  article: { icon: '✍️', label: 'esej' },
  file: { icon: '⬇', label: 'na stiahnutie' },
  link: { icon: '▶', label: 'odkaz' },
}

const SK_MONTHS = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra']
function skDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(+d) || +d === 0) return null
  return `${d.getDate()}. ${SK_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function ItemCard({ item }: { item: PremiumItem }) {
  const meta = TYPE_META[item.type]
  const date = skDate(item.updatedAt)
  const href =
    item.type === 'file'
      ? `/clenska/media/${item.id}`
      : item.type === 'link' && item.url
        ? item.url
        : `/clenska/obsah/${item.id}`
  const external = item.type !== 'article'

  const inner = (
    <div className="flex items-start gap-4">
      {/* embossed gold ikona typu */}
      <div
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #e8d3a0, #c9a96e 60%, #a8843f)',
          color: '#3a2e14',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.22), 0 4px 12px rgba(201,169,110,0.25)',
        }}
        aria-hidden
      >
        {meta.icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="kruh-essay-title font-lora text-[19px] sm:text-[21px] leading-[1.3] mb-1.5 text-[#1a1a1a]">
          {item.title}
          {item.type !== 'article' && <span className="ml-1.5 text-[15px] opacity-60">↗</span>}
        </h3>
        {item.excerpt && (
          <p className="mb-2 text-[14.5px] leading-[1.65] text-[#666]">{item.excerpt}</p>
        )}
        <p className="text-[12px] tracking-[0.04em] text-[#a08c60]">
          {meta.label}
          {item.type === 'file' && item.mediaSize ? ` · ${(item.mediaSize / 1024 / 1024).toFixed(1)} MB` : ''}
          {date ? ` · ${date}` : ''}
        </p>
      </div>
      <span className="mt-3 hidden text-[18px] text-[#c9a96e] sm:block" aria-hidden>→</span>
    </div>
  )

  const cls =
    'kruh-perk block rounded-2xl border border-black/[0.07] bg-white/80 px-5 py-5 sm:px-6 no-underline'

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

export default async function ObsahPage() {
  const member = await getMember()
  if (!member.isAuthed) redirect('/sign-in')

  const [cats, allItems] = await Promise.all([listCategories(), listItems()])
  const published = allItems.filter((i) => i.published)
  const sections = cats
    .map((c) => ({ cat: c, items: published.filter((i) => i.categoryId === c.id) }))
    .filter((s) => s.items.length > 0)

  const counts = {
    article: published.filter((i) => i.type === 'article').length,
    file: published.filter((i) => i.type === 'file').length,
    link: published.filter((i) => i.type === 'link').length,
  }
  const stats = [
    counts.article ? `${counts.article} ${counts.article === 1 ? 'esej' : counts.article < 5 ? 'eseje' : 'esejí'}` : null,
    counts.file ? `${counts.file} na stiahnutie` : null,
    counts.link ? `${counts.link} ${counts.link === 1 ? 'odkaz' : counts.link < 5 ? 'odkazy' : 'odkazov'}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] page-pad flex flex-col items-center">
      {/* top bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-12">
        <Link
          href="/clenska"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a] transition-colors no-underline"
        >
          ← kruh
        </Link>
        <div className="flex items-center gap-4">
          {member.isAdmin && (
            <Link
              href="/clenska/admin"
              className="text-[12px] no-underline hover:underline"
              style={{ color: '#a8843f' }}
            >
              ✦ admin
            </Link>
          )}
          <UserButton />
        </div>
      </div>

      {/* header */}
      <header className="w-full max-w-3xl mb-10 text-center">
        <div
          className="kruh-seal mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #e8d3a0, #c9a96e 60%, #a8843f)',
            boxShadow:
              'inset 0 2px 5px rgba(255,255,255,0.45), inset 0 -4px 8px rgba(0,0,0,0.28), 0 6px 18px rgba(201,169,110,0.4)',
          }}
        >
          <span className="font-lora text-[26px] leading-none" style={{ color: '#3a2e14' }}>K</span>
        </div>
        <p
          className="text-[11px] font-medium tracking-[0.32em] uppercase mb-5"
          style={{ color: '#a8843f' }}
        >
          ✦ Kruh
        </p>
        <h1 className="font-lora text-[34px] sm:text-[44px] leading-[1.12] mb-4">
          Vitaj v kruhu{member.firstName ? `, ${member.firstName}` : ''}.
        </h1>
        <p className="mx-auto max-w-lg text-[16px] leading-[1.7] text-[#666]">
          Toto je tvoje tiché miesto — texty a materiály, ktoré nedávam na verejný web.
        </p>
        {stats && (
          <p className="mt-4 text-[12.5px] tracking-[0.06em] text-[#a08c60]">{stats}</p>
        )}
      </header>

      <hr className="kruh-hairline w-full max-w-3xl mb-12" />

      {sections.length === 0 ? (
        <section className="w-full max-w-3xl text-center">
          <p className="text-[15px] leading-[1.7] text-[#888]">
            Zatiaľ tu nič nie je — pripravujem prvý obsah. Čoskoro. 🤍
          </p>
        </section>
      ) : (
        sections.map(({ cat, items }) => (
          <section key={cat.id} className="w-full max-w-3xl mb-14">
            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-[14px]" style={{ color: '#c9a96e' }} aria-hidden>✦</span>
              <h2 className="font-lora text-[24px] sm:text-[26px]">{cat.name}</h2>
              <span className="text-[12.5px] text-[#aaa]">{items.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {items.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </section>
        ))
      )}

      <p
        className="mb-4 mt-6 text-[20px] -rotate-2"
        style={{ fontFamily: 'var(--font-caveat), cursive', color: '#9a8358' }}
      >
        pomaly. zámerne. len pre teba.
      </p>
    </main>
  )
}
