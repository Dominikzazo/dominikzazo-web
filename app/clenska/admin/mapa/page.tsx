import Link from 'next/link'
import { listPlaces } from '@/lib/cms/public'
import { savePlace, removePlace } from './actions'
import type { Place } from '@/lib/cms/types'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'
const btnGold =
  'rounded-full bg-[#c9a96e] px-5 py-2 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d]'

const STATUS_LABEL: Record<string, string> = {
  home: 'domov',
  visited: 'navštívené',
  last: 'naposledy',
  wishlist: 'wishlist',
}

function PlaceForm({ place }: { place?: Place }) {
  return (
    <form action={savePlace} className="flex flex-col gap-3">
      {place && <input type="hidden" name="id" value={place.id} />}
      <div className="flex gap-3">
        <input name="name" placeholder="Mesto" required defaultValue={place?.name} className={input} />
        <input name="emoji" placeholder="Emoji" defaultValue={place?.emoji} className={input} style={{ maxWidth: 90 }} />
        <select name="status" defaultValue={place?.status ?? 'wishlist'} className={input}>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <input name="lon" placeholder="Lon (napr. 17.1)" defaultValue={place?.lon} className={input} />
        <input name="lat" placeholder="Lat (napr. 48.1)" defaultValue={place?.lat} className={input} />
      </div>
      <input name="note" placeholder="Poznámka (zobrazí sa na karte)" defaultValue={place?.note} className={input} />
      <label className="flex items-center gap-2 text-[13px] text-[#666]">
        <input type="checkbox" name="onMap" defaultChecked={place?.onMap ?? true} />
        zobraziť ako pin na mape (vypni pre miesta mimo Európy, napr. Tokio)
      </label>
      <button className={`${btnGold} self-start`}>{place ? 'Uložiť zmeny' : '+ Pridať miesto'}</button>
    </form>
  )
}

export default async function MapaAdmin() {
  const places = await listPlaces()

  return (
    <main className="page-pad mx-auto flex max-w-2xl flex-col">
      <div className="mb-8">
        <Link href="/clenska/admin" className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline">
          ← admin
        </Link>
      </div>
      <h1 className="mb-2 font-lora text-[30px]">Cestovanie / Mapa</h1>
      <p className="mb-8 text-[14px] text-[#666]">
        Piny na ručne kreslenej mape + karty miest. Lon/lat nájdeš na Google Maps (pravý klik na miesto).
      </p>

      <div className="mb-10 flex flex-col gap-2">
        {places.map((p) => (
          <details key={p.id} className="rounded-xl border border-black/[0.07] bg-white/60">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
              <span className="min-w-0">
                <span className="text-[14px] font-medium">{p.emoji} {p.name}</span>
                <span className="ml-2 text-[12px] text-[#999]">
                  {STATUS_LABEL[p.status]}{p.onMap ? '' : ' · mimo mapy'}
                </span>
              </span>
              <span className="shrink-0 text-[12px] text-[#a8843f]">upraviť ↓</span>
            </summary>
            <div className="border-t border-black/[0.06] p-4">
              <PlaceForm place={p} />
              <form action={removePlace} className="mt-3">
                <input type="hidden" name="id" value={p.id} />
                <button className="text-[12px] text-[#c66] hover:underline">zmazať miesto</button>
              </form>
            </div>
          </details>
        ))}
      </div>

      <section className="rounded-xl border border-black/[0.08] bg-white/50 p-5">
        <h2 className="mb-4 font-lora text-[17px]">Pridať miesto</h2>
        <PlaceForm />
      </section>
    </main>
  )
}
