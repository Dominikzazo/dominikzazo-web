import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { getMember } from '@/lib/members/session'

const PERKS = [
  {
    t: 'Hlbšie eseje',
    d: 'Dlhšie, tichšie texty a poznámky, ktoré nedávam na verejný web.',
  },
  {
    t: 'Na stiahnutie',
    d: 'PDF sprievodcovia a pracovné listy k journalingu a spomaleniu.',
  },
  {
    t: 'Skôr a bez šumu',
    d: 'Nové veci dostaneš prv, než sa dostanú k zvyšku sveta.',
  },
]

export default async function ClenskaLanding() {
  const member = await getMember()

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] page-pad flex flex-col items-center">
      {/* top bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Link
          href="/"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a] transition-colors no-underline"
        >
          ← domov
        </Link>
        {member.isAuthed && <UserButton />}
      </div>

      {/* premium hero panel */}
      <section
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#c9a96e]/25 px-6 py-14 sm:px-14 sm:py-16 text-center"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, #23211c 0%, #1a1a1a 55%, #141414 100%)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        }}
      >
        {/* jemný gold glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #c9a96e 0%, transparent 70%)' }}
        />

        <p
          className="relative text-[11px] font-medium tracking-[0.28em] uppercase mb-6"
          style={{ color: '#c9a96e' }}
        >
          ✦ Kruh
        </p>

        <h1
          className="relative font-lora text-[#faf7f0] text-[32px] sm:text-[46px] leading-[1.12] mb-5"
        >
          {member.isAuthed ? (
            <>Vitaj späť{member.firstName ? `, ${member.firstName}` : ''}.</>
          ) : (
            <>Tichšie miesto,<br />pre tých čo idú hlbšie.</>
          )}
        </h1>

        <p className="relative mx-auto max-w-md text-[15.5px] leading-[1.7] text-[#c9c6bd] mb-9">
          {member.isAuthed
            ? 'Máš prístup do členskej sekcie. Poď dnu.'
            : 'Registrácia je zadarmo. Zopár textov a nástrojov, ktoré nepatria do hluku verejného internetu — len pre teba.'}
        </p>

        {/* CTA */}
        <div className="relative flex flex-col items-center gap-4">
          {member.isAuthed ? (
            <Link
              href="/clenska/obsah"
              className="inline-flex items-center gap-2 rounded-full px-8 py-[13px] text-[14.5px] font-medium no-underline transition-transform hover:-translate-y-0.5"
              style={{ background: '#c9a96e', color: '#1a1a1a' }}
            >
              Vstúpiť do obsahu →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full px-8 py-[13px] text-[14.5px] font-medium no-underline transition-transform hover:-translate-y-0.5"
                style={{ background: '#c9a96e', color: '#1a1a1a' }}
              >
                Zaregistruj sa zadarmo
              </Link>
              <p className="text-[13px] text-[#8f8c84]">
                Už si členom?{' '}
                <Link href="/sign-in" className="text-[#c9a96e] no-underline hover:underline">
                  Prihlás sa
                </Link>
              </p>
            </>
          )}
        </div>

        <p
          className="relative mt-10 text-[19px] -rotate-2"
          style={{ fontFamily: 'var(--font-caveat), cursive', color: '#9a8358' }}
        >
          pomaly. zámerne. len pre teba.
        </p>
      </section>

      {/* perks */}
      <section className="w-full max-w-3xl mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PERKS.map((p) => (
          <div
            key={p.t}
            className="rounded-2xl border border-black/[0.07] bg-white/60 px-5 py-6"
          >
            <div
              className="mb-3 flex h-7 w-7 items-center justify-center rounded-full text-[13px]"
              style={{ background: 'rgba(201,169,110,0.15)', color: '#a8843f' }}
            >
              ✦
            </div>
            <h3 className="font-lora text-[17px] mb-1.5">{p.t}</h3>
            <p className="text-[13.5px] leading-[1.6] text-[#666]">{p.d}</p>
          </div>
        ))}
      </section>

      <p className="mt-10 text-[12px] text-[#aaa]">Zadarmo · žiadna karta · odhlásiš sa kedykoľvek</p>
    </main>
  )
}
