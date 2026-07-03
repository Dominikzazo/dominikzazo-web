import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'

export const metadata = { title: 'Kruh · obsah · Dominik Žažo' }

// Placeholder obsah — reálne texty/PDF doplníme. Route je chránená v proxy.ts,
// tu je ešte druhá poistka pre istotu.
const ESSAYS = [
  { t: 'Ako som prestal vypĺňať ticho', d: 'O tom, prečo je nuda vstupná brána, nie problém.' },
  { t: 'Ranný list sebe', d: 'Praktika, ktorá mi vydržala najdlhšie zo všetkých.' },
  { t: 'Menej, ale hlbšie', d: 'Prečo som zmazal appky a čo sa stalo potom.' },
]

export default async function ObsahPage() {
  const member = await getMember()
  if (!member.isAuthed) redirect('/sign-in')

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
        <UserButton />
      </div>

      {/* header */}
      <header className="w-full max-w-2xl mb-10">
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
          Toto je tvoje tiché miesto. Zatiaľ je tu placeholder — čoskoro pribudnú
          reálne eseje a materiály na stiahnutie.
        </p>
      </header>

      {/* PDF download placeholder */}
      <section className="w-full max-w-2xl mb-12">
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border px-5 py-5"
          style={{ borderColor: 'rgba(201,169,110,0.4)', background: 'rgba(201,169,110,0.08)' }}
        >
          <div>
            <h3 className="font-lora text-[17px] mb-0.5">Sprievodca tichom (PDF)</h3>
            <p className="text-[13px] text-[#777]">7 strán · pracovný list k spomaleniu</p>
          </div>
          <span
            className="shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-medium opacity-60 cursor-not-allowed"
            style={{ background: '#c9a96e', color: '#1a1a1a' }}
            title="Čoskoro"
          >
            Čoskoro ↓
          </span>
        </div>
      </section>

      {/* essays placeholder */}
      <section className="w-full max-w-2xl">
        <h2 className="font-lora text-[20px] mb-5">Eseje</h2>
        <div className="flex flex-col divide-y divide-black/[0.07] border-y border-black/[0.07]">
          {ESSAYS.map((e) => (
            <article key={e.t} className="py-5">
              <h3 className="font-lora text-[18px] mb-1">{e.t}</h3>
              <p className="text-[14px] leading-[1.6] text-[#666]">{e.d}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-[12px] text-[#aaa]">Čoskoro odomknuté · pripravujem obsah</p>
      </section>
    </main>
  )
}
