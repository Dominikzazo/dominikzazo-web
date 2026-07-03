import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'
import { listCategories, listItems } from '@/lib/cms/premium'

export const metadata = { title: 'Kruh · obsah · Dominik Žažo' }

export default async function ObsahPage() {
  const member = await getMember()
  if (!member.isAuthed) redirect('/sign-in')

  const [cats, allItems] = await Promise.all([listCategories(), listItems()])
  const published = allItems.filter((i) => i.published)
  const sections = cats
    .map((c) => ({ cat: c, items: published.filter((i) => i.categoryId === c.id) }))
    .filter((s) => s.items.length > 0)

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] page-pad flex flex-col items-center">
      {/* top bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-10">
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
      <header className="w-full max-w-2xl mb-8">
        <div
          className="kruh-seal mb-5 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #e8d3a0, #c9a96e 60%, #a8843f)',
            boxShadow:
              'inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.25), 0 5px 14px rgba(201,169,110,0.35)',
          }}
        >
          <span className="font-lora text-[20px] leading-none" style={{ color: '#3a2e14' }}>K</span>
        </div>
        <p
          className="text-[11px] font-medium tracking-[0.28em] uppercase mb-4"
          style={{ color: '#a8843f' }}
        >
          ✦ Kruh
        </p>
        <h1 className="font-lora text-[30px] sm:text-[38px] leading-[1.15] mb-3">
          Vitaj v kruhu{member.firstName ? `, ${member.firstName}` : ''}.
        </h1>
        <p className="text-[15.5px] leading-[1.7] text-[#666]">
          Toto je tvoje tiché miesto — texty a materiály, ktoré nedávam na verejný web.
        </p>
      </header>

      <hr className="kruh-hairline w-full max-w-2xl mb-10" />

      {sections.length === 0 ? (
        <section className="w-full max-w-2xl">
          <p className="text-[14px] leading-[1.7] text-[#888]">
            Zatiaľ tu nič nie je — pripravujem prvý obsah. Čoskoro. 🤍
          </p>
        </section>
      ) : (
        sections.map(({ cat, items }) => (
          <section key={cat.id} className="w-full max-w-2xl mb-12">
            <h2 className="font-lora text-[20px] mb-5">{cat.name}</h2>
            <div className="flex flex-col divide-y divide-black/[0.07] border-y border-black/[0.07]">
              {items.map((it) =>
                it.type === 'file' ? (
                  <a
                    key={it.id}
                    href={`/clenska/media/${it.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kruh-essay block py-5 no-underline"
                  >
                    <h3 className="kruh-essay-title font-lora text-[18px] mb-1 text-[#1a1a1a]">
                      {it.title} ↓
                    </h3>
                    <p className="text-[14px] leading-[1.6] text-[#666]">
                      {it.excerpt || it.fileName}
                      {it.mediaSize ? ` · ${(it.mediaSize / 1024 / 1024).toFixed(1)} MB` : ''}
                    </p>
                  </a>
                ) : it.type === 'link' && it.url ? (
                  <a
                    key={it.id}
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kruh-essay block py-5 no-underline"
                  >
                    <h3 className="kruh-essay-title font-lora text-[18px] mb-1 text-[#1a1a1a]">
                      {it.title} ↗
                    </h3>
                    {it.excerpt && (
                      <p className="text-[14px] leading-[1.6] text-[#666]">{it.excerpt}</p>
                    )}
                  </a>
                ) : (
                  <Link
                    key={it.id}
                    href={`/clenska/obsah/${it.id}`}
                    className="kruh-essay block py-5 no-underline"
                  >
                    <h3 className="kruh-essay-title font-lora text-[18px] mb-1 text-[#1a1a1a]">
                      {it.title}
                    </h3>
                    {it.excerpt && (
                      <p className="text-[14px] leading-[1.6] text-[#666]">{it.excerpt}</p>
                    )}
                  </Link>
                ),
              )}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
