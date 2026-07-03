import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'
import { listCategories, listItems } from '@/lib/cms/premium'

export default async function AdminHome() {
  const [member, cats, items] = await Promise.all([getMember(), listCategories(), listItems()])
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
        Tu upravuješ obsah bez kódu. Zatiaľ je hotová správa <strong>Kruh obsahu</strong> (eseje,
        odkazy na videá/PDF). Knihy a mapa pribudnú v ďalšej fáze.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/clenska/admin/kruh"
          className="kruh-perk rounded-2xl border border-black/[0.08] bg-white/70 p-6 no-underline"
        >
          <div
            className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-[13px]"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #e8d3a0, #c9a96e 60%, #a8843f)',
              color: '#3a2e14',
            }}
          >
            ✦
          </div>
          <h2 className="mb-1 font-lora text-[18px] text-[#1a1a1a]">Kruh — obsah</h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            {items.length} položiek · {published} publikovaných · {cats.length} kategórií
          </p>
        </Link>

        <div className="rounded-2xl border border-dashed border-black/[0.12] p-6 opacity-70">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-[13px]">
            📚
          </div>
          <h2 className="mb-1 font-lora text-[18px]">Knihy & Mapa</h2>
          <p className="text-[13px] leading-[1.6] text-[#999]">Čoskoro (Fáza 2).</p>
        </div>
      </div>
    </main>
  )
}
