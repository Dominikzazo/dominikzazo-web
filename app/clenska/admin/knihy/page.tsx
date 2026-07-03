import Link from 'next/link'
import { listBooks } from '@/lib/cms/public'
import { saveBook, removeBook } from './actions'
import SaveButton from '@/components/admin/SaveButton'
import type { Book } from '@/lib/cms/types'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const btnGold =
  'rounded-full bg-[#c9a96e] px-5 py-2 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d]'

function BookForm({ book }: { book?: Book }) {
  return (
    <form action={saveBook} className="flex flex-col gap-3">
      {book && <input type="hidden" name="id" value={book.id} />}
      <div className="flex gap-3">
        <input name="title" placeholder="Názov" required defaultValue={book?.title} className={input} />
        <input name="author" placeholder="Autor" defaultValue={book?.author} className={input} />
      </div>
      <div className="flex gap-3">
        <select name="status" defaultValue={book?.status ?? 'práve čítam'} className={input}>
          <option value="práve čítam">práve čítam</option>
          <option value="prečítané">prečítané</option>
          <option value="chcem čítať">chcem čítať</option>
        </select>
        <input name="year" placeholder="Rok (napr. 2025)" defaultValue={book?.year ?? ''} className={input} />
      </div>
      <input name="note" placeholder="Poznámka (kurzívou na karte)" defaultValue={book?.note ?? ''} className={input} />
      <input name="tags" placeholder="Tagy oddelené čiarkou (ticho, filozofia)" defaultValue={book?.tags.join(', ')} className={input} />
      <SaveButton>{book ? 'Uložiť zmeny' : '+ Pridať knihu'}</SaveButton>
    </form>
  )
}

export default async function KnihyAdmin() {
  const books = await listBooks()

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col">
      <div className="mb-8">
        <Link href="/clenska/admin" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← admin
        </Link>
      </div>
      <h1 className="mb-2 font-lora text-[30px]">Knihy</h1>
      <p className="mb-8 text-[14px] text-[#666]">
        Sekcia „čítam." na homepage. Zmeny sa prejavia okamžite.
      </p>

      <div className="mb-10 flex flex-col gap-2">
        {books.map((b) => (
          <details key={b.id} className="rounded-xl border border-black/[0.07] bg-white/60">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
              <span className="min-w-0">
                <span className="text-[14px] font-medium">{b.title}</span>
                <span className="ml-2 text-[12px] text-[#999]">{b.author} · {b.status}</span>
              </span>
              <span className="shrink-0 text-[12px] text-[#a8843f]">upraviť ↓</span>
            </summary>
            <div className="border-t border-black/[0.06] p-4">
              <BookForm book={b} />
              <form action={removeBook} className="mt-3">
                <input type="hidden" name="id" value={b.id} />
                <button className="text-[12px] text-[#c66] hover:underline">zmazať knihu</button>
              </form>
            </div>
          </details>
        ))}
      </div>

      <section className="rounded-xl border border-black/[0.08] bg-white/50 p-5">
        <h2 className="mb-4 font-lora text-[17px]">Pridať knihu</h2>
        <BookForm />
      </section>
    </main>
  )
}
