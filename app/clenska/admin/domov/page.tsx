import Link from 'next/link'
import { getHomepage, getAbout } from '@/lib/cms/public'
import { saveHomepage, saveAbout } from './actions'
import SaveButton from '@/components/admin/SaveButton'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const label = 'text-[12px] font-medium text-[#888]'
const hint = 'text-[11px] text-[#aaa] mt-1'

export default async function DomovAdminPage() {
  const [home, about] = await Promise.all([getHomepage(), getAbout()])

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col pb-20">
      <div className="mb-8">
        <Link href="/clenska/admin" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← admin
        </Link>
      </div>

      <h1 className="mb-2 font-lora text-[30px]">Domov & O mne</h1>
      <p className="mb-8 text-[14px] text-[#666]">
        Upravuj úvodné predstavenie, status „teraz", citát a fakty v sekcii O mne bez zásahu do kódu.
        Pre zvýraznenie textu môžeš použiť <code className="rounded bg-black/[0.05] px-1 py-0.5 text-[12px]">**hrubý text**</code>.
      </p>

      {/* ── Sekcia: Domovská stránka ── */}
      <div className="mb-12 rounded-2xl border border-black/[0.08] bg-white/70 p-6">
        <h2 className="mb-1 font-lora text-[20px] text-[#1a1a1a]">Domovská stránka (Hero & Bento)</h2>
        <p className="mb-6 text-[13px] text-[#888]">
          Úvodná obrazovka po načítaní dominikzazo.sk
        </p>

        <form action={saveHomepage} className="flex flex-col gap-4">
          <div>
            <p className={label}>Hlavný pozdrav / Nadpis</p>
            <input name="greeting" defaultValue={home.greeting} className={input} />
          </div>

          <div>
            <p className={label}>1. odsek predstavenia</p>
            <textarea name="bio1" defaultValue={home.bio1} rows={3} className={input} />
            <p className={hint}>Napr. Mám 22 rokov, pijem **Chemex**...</p>
          </div>

          <div>
            <p className={label}>2. odsek predstavenia</p>
            <textarea name="bio2" defaultValue={home.bio2} rows={3} className={input} />
          </div>

          <div>
            <p className={label}>Spodné motto (tagline)</p>
            <input name="tagline" defaultValue={home.tagline} className={input} />
          </div>

          <div className="border-t border-black/[0.08] pt-4">
            <h3 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Bento Grid (kartičky vpravo)</h3>
            
            <div className="flex flex-col gap-3">
              <div>
                <p className={label}>Kartička: ○ teraz</p>
                <input name="nowText" defaultValue={home.nowText} className={input} />
              </div>

              <div>
                <p className={label}>Kartička: Citát</p>
                <input name="quoteText" defaultValue={home.quoteText} className={input} />
              </div>

              <div>
                <p className={label}>Tagy k citátu (oddelené čiarkou)</p>
                <input name="quoteTags" defaultValue={home.quoteTags.join(', ')} className={input} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className={label}>Fotka 1 URL</p>
                  <input name="photo1Src" defaultValue={home.photo1Src} className={input} />
                </div>
                <div>
                  <p className={label}>Fotka 1 Popisok</p>
                  <input name="photo1Label" defaultValue={home.photo1Label} className={input} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className={label}>Fotka 2 URL</p>
                  <input name="photo2Src" defaultValue={home.photo2Src} className={input} />
                </div>
                <div>
                  <p className={label}>Fotka 2 Popisok</p>
                  <input name="photo2Label" defaultValue={home.photo2Label} className={input} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <SaveButton>Uložiť domovskú stránku</SaveButton>
          </div>
        </form>
      </div>

      {/* ── Sekcia: O mne ── */}
      <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-6">
        <h2 className="mb-1 font-lora text-[20px] text-[#1a1a1a]">Sekcia „O mne"</h2>
        <p className="mb-6 text-[13px] text-[#888]">
          Detailné bio, profilovka a kartičky faktov.
        </p>

        <form action={saveAbout} className="flex flex-col gap-4">
          <div>
            <p className={label}>Nadpis sekcie</p>
            <input name="title" defaultValue={about.title} className={input} />
          </div>

          <div>
            <p className={label}>1. odsek</p>
            <textarea name="bio1" defaultValue={about.bio1} rows={2} className={input} />
          </div>

          <div>
            <p className={label}>2. odsek</p>
            <textarea name="bio2" defaultValue={about.bio2} rows={2} className={input} />
          </div>

          <div>
            <p className={label}>3. odsek</p>
            <textarea name="bio3" defaultValue={about.bio3} rows={2} className={input} />
          </div>

          <div>
            <p className={label}>4. odsek</p>
            <textarea name="bio4" defaultValue={about.bio4} rows={2} className={input} />
          </div>

          <div>
            <p className={label}>Hlavná fotka (URL)</p>
            <input name="photoSrc" defaultValue={about.photoSrc} className={input} />
          </div>

          <div>
            <p className={label}>Fakty o mne — jeden na riadok vo formáte „emoji | Názov | Popis"</p>
            <textarea
              name="facts"
              defaultValue={about.facts.map((f) => `${f.emoji} | ${f.title} | ${f.desc}`).join('\n')}
              rows={8}
              className={input}
            />
            <p className={hint}>Napr. ☕ | Chemex adept | Pomalá káva pre pomalý deň.</p>
          </div>

          <div className="pt-2">
            <SaveButton>Uložiť sekciu O mne</SaveButton>
          </div>
        </form>
      </div>
    </main>
  )
}
