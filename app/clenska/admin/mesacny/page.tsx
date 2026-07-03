import Link from 'next/link'
import { getMonthly } from '@/lib/cms/public'
import { saveMonthly } from './actions'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const label = 'text-[12px] font-medium text-[#888]'

export default async function MesacnyAdmin() {
  const m = await getMonthly()

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col">
      <div className="mb-8">
        <Link href="/clenska/admin" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← admin
        </Link>
      </div>
      <h1 className="mb-2 font-lora text-[30px]">Mesačný edit</h1>
      <p className="mb-8 text-[14px] text-[#666]">
        Sekcia „{m.heading}" na homepage — živý zápisník mesiaca.
      </p>

      <form action={saveMonthly} className="flex flex-col gap-4">
        <div>
          <p className={label}>Obdobie (malý text hore)</p>
          <input name="label" defaultValue={m.label} className={input} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className={label}>Nadpis (napr. „jún. 🌞")</p>
            <input name="heading" defaultValue={m.heading} className={input} />
          </div>
          <div className="flex-1">
            <p className={label}>Podnadpis</p>
            <input name="subtitle" defaultValue={m.subtitle} className={input} />
          </div>
        </div>
        <div>
          <p className={label}>Jedna hlavná vec — nadpis</p>
          <input name="mainTitle" defaultValue={m.mainTitle} className={input} />
        </div>
        <div>
          <p className={label}>Jedna hlavná vec — popis</p>
          <textarea name="mainText" defaultValue={m.mainText} rows={2} className={input} />
        </div>
        <div>
          <p className={label}>Zámery — jeden na riadok vo formáte „emoji | text"</p>
          <textarea
            name="intentions"
            defaultValue={m.intentions.map((i) => `${i.emoji} | ${i.text}`).join('\n')}
            rows={6}
            className={input}
          />
        </div>
        <div>
          <p className={label}>Citát na záver (Caveat rukopis)</p>
          <input name="quote" defaultValue={m.quote} className={input} />
        </div>
        <button className="self-start rounded-full bg-[#c9a96e] px-6 py-2.5 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d]">
          Uložiť mesačný edit
        </button>
      </form>
    </main>
  )
}
