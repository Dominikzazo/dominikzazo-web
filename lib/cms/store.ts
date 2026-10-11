import { put, list, del } from '@vercel/blob'
import { Redis } from '@upstash/redis'
import { neon } from '@neondatabase/serverless'
import type { CmsData, HomepageData, AboutData } from './types'

// Úložisko pre CMS:
// 1. Prioritne Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN) — už nakonfigurované na Verceli (rovnako ako newsletter).
//    O(1) get/set, nulové riziko vyčerpania Blob limitov.
// 2. Sekundárne Postgres (DATABASE_URL / POSTGRES_URL) cez Neon.
// 3. Spätný fallback na Vercel Blob a SEED.

const REDIS_KEY = 'cms:data'
const BLOB_PREFIX = 'cms/data'
const BLOB_KEEP_VERSIONS = 5

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
  homepage: {
    greeting: 'Ahoj, ja som Dominik. 👋',
    bio1: 'Mám 22 rokov, pijem **Chemex** ako keby od toho závisel život a moja najlepšia life advice? **Nauč sa byť ticho, aspoň chvíľku.** 🌿',
    bio2: 'Baví ma **spomalenie**, každý deň **žurnálujem**, cestujem rýchlikom kedykoľvek sa dá 🚄 a tajne si myslím, že **Traja pátrači** sú najlepšia detektívka ever.',
    tagline: 'Toto je môj **vedomý kút internetu**. Pomaly. Zámerne. Ľudsky.',
    nowText: 'Teraz: druhá šálka z Chemexu a plánujem víkendový výlet rýchlikom. 🚄',
    quoteText: 'Najlepšia rada na svete: nauč sa byť ticho, aspoň chvíľku. 🌿',
    quoteTags: ['ticho'],
    photo1Src: '/uploads/IMG_1978_3.JPG',
    photo1Label: 'Chemex moment',
    photo2Src: '/uploads/IMG_0326_3.JPG',
    photo2Label: 'Niekde na svete',
  },
  about: {
    title: 'o mne.',
    bio1: 'Ahoj! Som Dominik, mám 22 rokov, som z Považana a snažím sa žiť pomaly v dobe, ktorá nás všetkých tlačí do rýchlosti. 🌱',
    bio2: 'Ráno začínam **Chemexom** ☕, potom žurnálujem a až potom sa pozriem na telefón. Pracujem v **Amityage** a popri tom pomáham ľuďom porozumieť **Bitcoinu**. 🟠',
    bio3: 'Fanúšik **Mariánskej mládeže** 🙏, amatérsky **volejbalista** 🏐 a profesionálny užívač **skórovania** 😄. Kofola je moja slabosť. Závislosť? Možno. :OO',
    bio4: 'Milujem **gýčové havajské košele** 🌺 a kto povie, že Traja pátrači nie sú top, nemáme čo riešiť.',
    photoSrc: '/uploads/IMG_9642_2.JPG',
    facts: [
      { emoji: '☕', title: 'Chemex adept', desc: 'Pomalá káva pre pomalý deň.' },
      { emoji: '🧦', title: 'Parkside fanúšik', desc: 'Lidl merch je underrated.' },
      { emoji: '🟠', title: 'Bitcoin konzultant', desc: 'Chráni tvoj čas pred infláciou.' },
      { emoji: '🚄', title: 'Vlakový nájomník', desc: 'Považan, Bratislava, Považan...' },
      { emoji: '🏐', title: 'Amatér volejbalista', desc: 'Profík na skórovanie. 😄' },
      { emoji: '🌺', title: 'Havajské košele', desc: 'Gýčové? Áno. Obanovaním? Nikdy.' },
      { emoji: '🚲', title: 'Bicykel', desc: 'Cesta, nie cieľ. Vždy.' },
      { emoji: '🙏', title: 'ZMM a viera', desc: 'Mariánska mládež, každodenná.' },
      { emoji: '🥤', title: 'Kofola závislosť', desc: '...závislosť je silné slovo. Alebo nie? :OO' },
    ],
  },
}

export const DEFAULT_HOMEPAGE: HomepageData = SEED.homepage!
export const DEFAULT_ABOUT: AboutData = SEED.about!

function redisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function getDbUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN
}

type BlobMeta = { url: string; pathname: string; uploadedAt: string | Date }

async function listVersions(t: string): Promise<BlobMeta[]> {
  const { blobs } = await list({ prefix: BLOB_PREFIX, token: t })
  return (blobs as BlobMeta[]).sort(
    (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
  )
}

function mergeWithSeed(data?: Partial<CmsData> | null): CmsData {
  if (!data) return SEED
  return {
    categories: data.categories ?? SEED.categories,
    items: data.items ?? SEED.items,
    books: data.books ?? SEED.books,
    places: data.places ?? SEED.places,
    monthly: data.monthly ?? SEED.monthly,
    homepage: data.homepage ? { ...DEFAULT_HOMEPAGE, ...data.homepage } : DEFAULT_HOMEPAGE,
    about: data.about ? { ...DEFAULT_ABOUT, ...data.about } : DEFAULT_ABOUT,
  }
}

export async function readData(): Promise<CmsData> {
  // 1. Skús Upstash Redis (KV) — rovnaký store ako používa newsletter
  const redis = redisClient()
  if (redis) {
    try {
      const raw = await redis.get<Partial<CmsData>>(REDIS_KEY)
      if (raw) return mergeWithSeed(raw)
    } catch (err) {
      console.error('CMS redis read failed:', err)
    }
  }

  // 2. Skús Postgres (Neon)
  const dbUrl = getDbUrl()
  if (dbUrl) {
    try {
      const sql = neon(dbUrl)
      const rows = (await sql`SELECT data FROM cms_store WHERE id = 'main' LIMIT 1`) as { data: any }[]
      if (rows && rows.length > 0 && rows[0].data) {
        return mergeWithSeed(rows[0].data)
      }
    } catch (err) {
      console.error('CMS postgres read failed:', err)
    }
  }

  // 3. Fallback na Vercel Blob (ak existuje)
  const t = blobToken()
  if (t) {
    try {
      const versions = await listVersions(t)
      if (versions.length > 0) {
        const res = await fetch(versions[0].url, {
          headers: { Authorization: `Bearer ${t}` },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = (await res.json()) as Partial<CmsData>
          return mergeWithSeed(data)
        }
      }
    } catch {
      // Ignoruj Blob limity a vráť SEED
    }
  }

  return SEED
}

export async function writeData(data: CmsData): Promise<void> {
  // 1. Prioritne zapíš do Upstash Redis (KV)
  const redis = redisClient()
  if (redis) {
    await redis.set(REDIS_KEY, data)
    return
  }

  // 2. Sekundárne do Postgres (Neon)
  const dbUrl = getDbUrl()
  if (dbUrl) {
    const sql = neon(dbUrl)
    await sql`
      CREATE TABLE IF NOT EXISTS cms_store (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      INSERT INTO cms_store (id, data, updated_at)
      VALUES ('main', ${JSON.stringify(data)}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW()
    `
    return
  }

  // 3. Fallback do Vercel Blob
  const t = blobToken()
  if (t) {
    await put(`${BLOB_PREFIX}-${Date.now()}.json`, JSON.stringify(data, null, 2), {
      access: 'private',
      token: t,
      addRandomSuffix: true,
      contentType: 'application/json',
    })
    try {
      const versions = await listVersions(t)
      const old = versions.slice(BLOB_KEEP_VERSIONS).map((v) => v.url)
      if (old.length > 0) await del(old, { token: t })
    } catch {
      // upratovanie nesmie zhodiť zápis
    }
    return
  }

  throw new Error('Žiadne úložisko nie je nakonfigurované (chýba KV_REST_API_URL, DATABASE_URL ani BLOB token).')
}
