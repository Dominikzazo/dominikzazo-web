import Link from 'next/link'
import { getHomepage, getAbout } from '@/lib/cms/public'
import DomovAdminClient from '@/components/admin/DomovAdminClient'

export default async function DomovAdminPage() {
  const [home, about] = await Promise.all([getHomepage(), getAbout()])

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col pb-24">
      <div className="mb-8">
        <Link href="/clenska/admin" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← admin
        </Link>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: '#a8843f' }}>
          ✦ Správa obsahu
        </p>
        <h1 className="mb-2 font-lora text-[32px] text-[#1a1a1a]">Domov & O mne</h1>
        <p className="text-[14px] text-[#666]">
          Rozbaľ si sekciu, ktorú chceš upraviť. Zmeny sa na webe prejavia okamžite po uložení.
        </p>
      </div>

      <DomovAdminClient initialHome={home} initialAbout={about} />
    </main>
  )
}
