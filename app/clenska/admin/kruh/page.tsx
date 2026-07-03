import Link from 'next/link'
import { listCategories, listItems } from '@/lib/cms/premium'
import { addCategory, removeCategory, addItem, removeItem, togglePublish } from './actions'
import FileUploadForm from '@/components/admin/FileUploadForm'
import SaveButton from '@/components/admin/SaveButton'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const btnGold =
  'rounded-full bg-[#c9a96e] px-5 py-2 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d]'

export default async function KruhAdmin() {
  const [cats, items] = await Promise.all([listCategories(), listItems()])
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? '—'

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col">
      <div className="mb-8">
        <Link
          href="/clenska/admin"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline"
        >
          ← admin
        </Link>
      </div>
      <h1 className="mb-8 font-lora text-[30px]">Kruh — obsah</h1>

      {/* Kategórie */}
      <section className="mb-10">
        <h2 className="mb-4 font-lora text-[19px]">Kategórie</h2>
        <div className="mb-4 flex flex-col gap-2">
          {cats.length === 0 && <p className="text-[13px] text-[#999]">Zatiaľ žiadne kategórie.</p>}
          {cats.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-black/[0.07] bg-white/60 px-4 py-2.5"
            >
              <span className="text-[14px]">{c.name}</span>
              <form action={removeCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-[12px] text-[#c66] hover:underline">zmazať</button>
              </form>
            </div>
          ))}
        </div>
        <form action={addCategory} className="flex gap-2">
          <input name="name" placeholder="Názov kategórie" required className={input} />
          <button className={btnGold}>+ Pridať</button>
        </form>
      </section>

      {/* Položky */}
      <section className="mb-10">
        <h2 className="mb-4 font-lora text-[19px]">Položky ({items.length})</h2>
        <div className="mb-6 flex flex-col gap-2">
          {items.length === 0 && <p className="text-[13px] text-[#999]">Zatiaľ žiadny obsah.</p>}
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.07] bg-white/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: it.published ? '#7aaa7e' : '#ccc' }}
                    title={it.published ? 'publikované' : 'skryté'}
                  />
                  <span className="truncate text-[14px] font-medium">{it.title}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#999]">
                  {it.type === 'article' ? 'esej' : it.type === 'file' ? `súbor (${it.fileName ?? ''})` : 'odkaz'} · {catName(it.categoryId)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <form action={togglePublish}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-[12px] text-[#a8843f] hover:underline">
                    {it.published ? 'skryť' : 'publikovať'}
                  </button>
                </form>
                <form action={removeItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-[12px] text-[#c66] hover:underline">zmazať</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {/* Pridať položku */}
        {cats.length === 0 ? (
          <p className="text-[13px] text-[#999]">Najprv pridaj kategóriu, potom môžeš pridávať obsah.</p>
        ) : (
          <form action={addItem} className="flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-white/50 p-5">
            <h3 className="font-lora text-[16px]">Pridať položku</h3>
            <input name="title" placeholder="Názov" required className={input} />
            <div className="flex gap-3">
              <select name="categoryId" className={input}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="type" className={input} defaultValue="article">
                <option value="article">Esej (text)</option>
                <option value="link">Odkaz (video/PDF/URL)</option>
              </select>
            </div>
            <input name="excerpt" placeholder="Krátky popis (do zoznamu)" className={input} />
            <textarea name="body" placeholder="Text eseje (ak je to esej)" rows={5} className={input} />
            <input name="url" placeholder="URL (ak je to odkaz na video/PDF)" className={input} />
            <label className="flex items-center gap-2 text-[13px] text-[#666]">
              <input type="checkbox" name="published" /> publikovať hneď
            </label>
            <SaveButton>+ Pridať položku</SaveButton>
          </form>
        )}
      </section>

      {/* Upload súborov (PDF, audio, krátke video) do private Blobu */}
      {cats.length > 0 && (
        <section className="mb-10">
          <FileUploadForm categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
        </section>
      )}

      <p className="text-[12px] text-[#aaa]">
        Zmeny sa okamžite prejavia na <Link href="/clenska/obsah" className="underline">/clenska/obsah</Link>.
      </p>
    </main>
  )
}
