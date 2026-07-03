import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'
import { listCategories, listItems } from '@/lib/cms/premium'
import { listBooks, listPlaces, getMonthly } from '@/lib/cms/public'

const TILE =
  'kruh-perk rounded-2xl border border-black/[0.08] bg-white/70 p-6 no-underline'

function TileIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-[14px]"
      style={{
        background: 'radial-gradient(circle at 35% 30%, #e8d3a0, #c9a96e 60%, #a8843f)',
        color: '#3a2e14',
      }}
    >
      {children}
    </div>
  )
}

export default async function AdminHome() {
  const [member, cats, items, books, places, monthly] = await Promise.all([
    getMember(),
    listCategories(),
    listItems(),
    listBooks(),
    listPlaces(),
    getMonthly(),
  ])
  const published = items.filter((i) => i.published).length

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col">
      <div className="mb-10 flex items-center justify-between">
        <Link href="/clenska" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← kruh
        </Link>
        <UserButton />
      </div>

      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em]" style={{ color: '#a8843f' }}>
        ✦ Admin
      </p>
      <h1 className="mb-2 font-lora text-[32px] leading-[1.15]">
        Správa obsahu{member.firstName ? `, ${member.firstName}` : ''}.
      </h1>
      <p className="mb-10 text-[15px] leading-[1.7] text-[#666]">
        Všetko upravuješ tu, bez kódu. Zmeny sa na webe prejavia okamžite.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/clenska/admin/knihy" className={TILE}>
          <TileIcon>📚</TileIcon>
          <h2 className="mb-1 font-lora text-[18px] text-[#1a1a1a]">Knihy</h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            {books.length} kníh · sekcia „čítam."
          </p>
        </Link>

        <Link href="/clenska/admin/mapa" className={TILE}>
          <TileIcon>🗺️</TileIcon>
          <h2 className="mb-1 font-lora text-[18px] text-[#1a1a1a]">Cestovanie / Mapa</h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            {places.length} miest · piny + karty
          </p>
        </Link>

        <Link href="/clenska/admin/mesacny" className={TILE}>
          <TileIcon>🌸</TileIcon>
          <h2 className="mb-1 font-lora text-[18px] text-[#1a1a1a]">Mesačný edit</h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            „{monthly.heading}" · živý zápisník
          </p>
        </Link>

        <Link href="/clenska/admin/kruh" className={TILE}>
          <TileIcon>✦</TileIcon>
          <h2 className="mb-1 font-lora text-[18px] text-[#1a1a1a]">Kruh — prémiový obsah</h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            {items.length} položiek · {published} publikovaných · {cats.length} kategórií
          </p>
        </Link>
      </div>
    </main>
  )
}
