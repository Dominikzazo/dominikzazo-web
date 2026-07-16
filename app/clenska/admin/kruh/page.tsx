import Link from 'next/link'
import { listCategories, listItems } from '@/lib/cms/premium'
import { addCategory, removeCategory, saveItem, removeItem, togglePublish } from './actions'
import FileUploadForm from '@/components/admin/FileUploadForm'
import SaveButton from '@/components/admin/SaveButton'
import type { PremiumItem } from '@/lib/cms/types'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const btnGold =
  'rounded-full bg-[#c9a96e] px-5 py-2 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d]'

const TYPE_LABEL: Record<PremiumItem['type'], string> = {
  article: 'esej (text)',
  file: 'súbor',
  link: 'odkaz',
}

/** Formulár na pridanie aj úpravu. `item` = režim úpravy (typ sa nemení). */
function ItemForm({ item, cats }: { item?: PremiumItem; cats: { id: string; name: string }[] }) {
  const editing = Boolean(item)
  return (
    <form
      id="form"
      action={saveItem}
      className="flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-white/50 p-5"
      style={editing ? { borderColor: 'rgba(201,169,110,0.5)' } : undefined}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-lora text-[16px]">
          {editing ? `Upraviť — ${TYPE_LABEL[item!.type]}` : 'Pridať položku'}
        </h3>
        {editing && (
          <Link href="/clenska/admin/kruh" className="text-[12px] text-[#888] hover:underline">
            zrušiť
          </Link>
        )}
      </div>

      {editing && <input type="hidden" name="id" value={item!.id} />}

      <input name="title" placeholder="Názov" required defaultValue={item?.title} className={input} />

      <div className="flex gap-3">
        <select name="categoryId" defaultValue={item?.categoryId} className={input}>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {/* Typ sa dá zvoliť len pri vytváraní — pri úprave by rozbil médiá */}
        {!editing && (
          <select name="type" className={input} defaultValue="article">
            <option value="article">Esej (text)</option>
            <option value="link">Odkaz (video/PDF/URL)</option>
          </select>
        )}
      </div>

      <input
        name="excerpt"
        placeholder="Krátky popis (do zoznamu)"
        defaultValue={item?.excerpt}
        className={input}
      />

      {/* Pri úprave ukáž len pole, ktoré k typu patrí */}
      {(!editing || item!.type === 'article') && (
        <textarea
          name="body"
          placeholder="Text eseje (ak je to esej)"
          rows={editing ? 14 : 5}
          defaultValue={item?.body}
          className={input}
        />
      )}
      {(!editing || item!.type === 'link') && (
        <input
          name="url"
          placeholder="URL (YouTube/Vimeo sa prehrá priamo na stránke)"
          defaultValue={item?.url}
          className={input}
        />
      )}
      {editing && item!.type === 'file' && (
        <p className="text-[12px] text-[#999]">
          Súbor: {item!.fileName ?? '—'} (samotný súbor sa nedá vymeniť — nahraj nový a starý zmaž)
        </p>
      )}

      <label className="flex items-center gap-2 text-[13px] text-[#666]">
        <input type="checkbox" name="published" defaultChecked={item?.published} /> publikovať
      </label>

      <SaveButton>{editing ? 'Uložiť zmeny' : '+ Pridať položku'}</SaveButton>
    </form>
  )
}

export default async function KruhAdmin({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const [{ edit }, cats, items] = await Promise.all([searchParams, listCategories(), listItems()])
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? '—'
  const editing = edit ? items.find((i) => i.id === edit) : undefined

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
              className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
              style={
                editing?.id === it.id
                  ? { borderColor: 'rgba(201,169,110,0.6)', background: 'rgba(201,169,110,0.07)' }
                  : { borderColor: 'rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.6)' }
              }
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
                <Link
                  href={`/clenska/admin/kruh?edit=${it.id}#form`}
                  className="text-[12px] text-[#a8843f] hover:underline"
                >
                  upraviť
                </Link>
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

        {/* Pridať / upraviť položku */}
        {cats.length === 0 ? (
          <p className="text-[13px] text-[#999]">Najprv pridaj kategóriu, potom môžeš pridávať obsah.</p>
        ) : (
          <ItemForm
            key={editing?.id ?? 'new'}
            item={editing}
            cats={cats.map((c) => ({ id: c.id, name: c.name }))}
          />
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
