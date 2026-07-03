import { put, list, del } from '@vercel/blob'
import type { CmsData } from './types'

// Tenká vrstva nad úložiskom (Vercel Blob, private store `kruh-cms`).
// Celý CMS volá readData/writeData — ak raz vymeníme backend (Neon a pod.),
// meníme len tento súbor. Rovnaká filozofia ako getMember() nad Clerk.
//
// DÔLEŽITÉ: zápisy sú VERZIOVANÉ (každý save = nová cesta cms/data-<ts>.json).
// Prepisovanie tej istej cesty neslúži — Blob CDN drží starú verziu v cache
// (overené: read → write → read vrátil STALE HIT). Unikátna URL = vždy čerstvé.

const PREFIX = 'cms/data'
const KEEP_VERSIONS = 5 // mini-história posledných verzií

// SEED = doterajší hardcoded obsah webu. Použije sa, kým v Blobe nie je uložená
// prvá verzia (a ako fallback pri výpadku).
export const SEED: CmsData = {
  books: [
    { id: 'b1', title: 'O pôvode prosperity', author: 'Rob Chovanculiak', status: 'práve čítam', year: 2025, note: 'Konečne ekonómia, ktorá mi dáva zmysel.', tags: ['ekonómia', 'filozofia'], order: 0 },
    { id: 'b2', title: 'Inspirace Baťa', author: 'Gabriela Končitíková', status: 'práve čítam', year: 2025, note: 'Baťa bol možno najväčší slow thinker v biznise.', tags: ['história', 'inšpirácia'], order: 1 },
    { id: 'b3', title: 'Stillness Is the Key', author: 'Ryan Holiday', status: 'prečítané', year: 2025, note: 'Najlepšia knižka o tichu, ktorú som čítal.', tags: ['ticho', 'filozofia'], order: 2 },
    { id: 'b4', title: "The Artist's Way", author: 'Julia Cameron', status: 'prečítané', year: 2024, note: 'Ranné strany mi zmenili život. Vážne.', tags: ['kreativita', 'žurnálovanie'], order: 3 },
    { id: 'b5', title: 'Slow', author: 'Brooke McAlary', status: 'prečítané', year: 2024, note: 'Praktické a ľudské. Odporúčam každému.', tags: ['spomalenie'], order: 4 },
    { id: 'b6', title: 'In Praise of Slowness', author: 'Carl Honoré', status: 'chcem čítať', year: null, note: null, tags: ['spomalenie'], order: 5 },
  ],
  places: [
    { id: 'p1', name: 'Bratislava', lon: 17.1, lat: 48.1, status: 'home', emoji: '🏠', note: 'Môj domov, môj chaos, moja láska.', onMap: true, order: 0 },
    { id: 'p2', name: 'Praha', lon: 14.4, lat: 50.1, status: 'visited', emoji: '🍺', note: 'Starý Barrandov, Vltava, klobása.', onMap: true, order: 1 },
    { id: 'p3', name: 'Viedeň', lon: 16.4, lat: 48.2, status: 'visited', emoji: '☕', note: 'Kaviarňová kultúra na ďalšiu úroveň.', onMap: true, order: 2 },
    { id: 'p4', name: 'Budapešť', lon: 19.0, lat: 47.5, status: 'visited', emoji: '🌊', note: 'Kúpele Széchenyi, ruin bars, Dunaj.', onMap: true, order: 3 },
    { id: 'p5', name: 'Krakov', lon: 19.9, lat: 50.1, status: 'visited', emoji: '🥨', note: 'Stredoveká krása. Obedy za 4€.', onMap: true, order: 4 },
    { id: 'p6', name: 'Rím', lon: 12.5, lat: 41.9, status: 'visited', emoji: '🍕', note: 'Fontána di Trevi, pizza al taglio.', onMap: true, order: 5 },
    { id: 'p7', name: 'Tenerife', lon: -16.3, lat: 28.3, status: 'last', emoji: '🌋', note: 'Naposledy! Sopka Teide, západ slnka. 😍', onMap: true, order: 6 },
    { id: 'p8', name: 'Oslo', lon: 10.7, lat: 59.9, status: 'wishlist', emoji: '🏔️', note: 'Fjordy, losos, a ceny čo ma zničia.', onMap: true, order: 7 },
    { id: 'p9', name: 'Edinburgh', lon: -3.2, lat: 55.9, status: 'wishlist', emoji: '🏰', note: 'Škótske hrady a whisky.', onMap: true, order: 8 },
    { id: 'p10', name: 'Tbilisi', lon: 44.8, lat: 41.7, status: 'wishlist', emoji: '🍷', note: 'Gruzínske víno a khachapuri.', onMap: true, order: 9 },
    { id: 'p11', name: 'Tokio', lon: 139.7, lat: 35.7, status: 'wishlist', emoji: '🍜', note: 'Dlhodobý sen. Vlaky tam musia byť fenomenálne.', onMap: false, order: 10 },
  ],
  monthly: {
    label: 'apríl → máj 2025',
    heading: 'máj. 🌸',
    subtitle: 'Čo ma čaká tento mesiac. Živý zápisník.',
    mainTitle: 'Čítať viac, scrollovať menej. 📵',
    mainText: 'Experiment: každý deň aspoň 30 minút skutočnej knihy pred tým, než siahnem po telefóne.',
    intentions: [
      { emoji: '🚄', text: 'Plánovaný výlet rýchlikom niekde nové. Destinácia: surprise.' },
      { emoji: '📷', text: 'Odfotiť aspoň 5 vecí, ktoré by väčšina ľudí prehliadla.' },
      { emoji: '🚲', text: 'Prvá dlhšia jarná jazda na bicykli. Cesta, nie cieľ.' },
      { emoji: '🙏', text: 'Ráno tichšie ako minulý mesiac. Päť minút naviac.' },
      { emoji: '📖', text: 'Dokončiť Inspiráciu Baťa a napísať si tri veci, čo si z toho beriem.' },
    ],
    quote: '"Máj je jediný mesiac, kde každý ráno vyzerá ako sľub." 🌿',
  },
  categories: [{ id: 'eseje', name: 'Eseje', slug: 'eseje', order: 0 }],
  items: [
    {
      id: 'seed-1',
      categoryId: 'eseje',
      type: 'article',
      title: 'Ako som prestal vypĺňať ticho',
      excerpt: 'O tom, prečo je nuda vstupná brána, nie problém.',
      body: 'Túto esej čoskoro doplním. Zatiaľ len ticho.',
      published: true,
      order: 0,
      updatedAt: new Date(0).toISOString(),
    },
  ],
}

function token(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN
}

type BlobMeta = { url: string; pathname: string; uploadedAt: string | Date }

async function listVersions(t: string): Promise<BlobMeta[]> {
  const { blobs } = await list({ prefix: PREFIX, token: t })
  return (blobs as BlobMeta[]).sort(
    (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
  )
}

export async function readData(): Promise<CmsData> {
  const t = token()
  if (!t) return SEED
  try {
    const versions = await listVersions(t)
    if (versions.length === 0) return SEED
    const res = await fetch(versions[0].url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    })
    if (!res.ok) return SEED
    const data = (await res.json()) as Partial<CmsData>
    // Chýbajúce kľúče (staršia verzia dát) doplň zo SEEDu
    return {
      categories: data.categories ?? SEED.categories,
      items: data.items ?? SEED.items,
      books: data.books ?? SEED.books,
      places: data.places ?? SEED.places,
      monthly: data.monthly ?? SEED.monthly,
    }
  } catch {
    return SEED
  }
}

export async function writeData(data: CmsData): Promise<void> {
  const t = token()
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN chýba — úložisko nie je nakonfigurované.')

  // Nová verzia = nová cesta (unikátna URL obíde CDN cache starej verzie)
  await put(`${PREFIX}-${Date.now()}.json`, JSON.stringify(data, null, 2), {
    access: 'private',
    token: t,
    addRandomSuffix: true,
    contentType: 'application/json',
  })

  // Best-effort upratanie starých verzií (necháme mini-históriu)
  try {
    const versions = await listVersions(t)
    const old = versions.slice(KEEP_VERSIONS).map((v) => v.url)
    if (old.length > 0) await del(old, { token: t })
  } catch {
    // upratovanie nesmie zhodiť zápis
  }
}
