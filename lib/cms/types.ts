// Zdroj pravdy pre typy CMS obsahu. Zvyšok appky ich importuje odtiaľto.

// ── Verejný obsah ──────────────────────────────────────────

export type BookStatus = 'práve čítam' | 'prečítané' | 'chcem čítať'

export interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  year: number | null
  note: string | null
  tags: string[]
  order: number
}

export type PlaceStatus = 'home' | 'visited' | 'last' | 'wishlist'

export interface Place {
  id: string
  name: string
  lon: number
  lat: number
  status: PlaceStatus
  emoji: string
  note: string
  onMap: boolean // false = mimo záberu SVG mapy (napr. Tokio), zobrazí sa len ako karta
  order: number
}

// Mesačný edit (sekcia „máj 🌸" — živý zápisník mesiaca)
export interface MonthlyEdit {
  label: string // napr. „apríl → máj 2025"
  heading: string // napr. „máj. 🌸"
  subtitle: string // napr. „Čo ma čaká tento mesiac. Živý zápisník."
  mainTitle: string // „jedna hlavná vec" — nadpis
  mainText: string // „jedna hlavná vec" — popis
  intentions: { emoji: string; text: string }[]
  quote: string
}

// ── Premium obsah (Kruh) ───────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  order: number
}

export type PremiumType = 'article' | 'link' | 'file'

export interface PremiumItem {
  id: string
  categoryId: string
  type: PremiumType
  title: string
  excerpt: string
  body?: string // type === 'article'
  url?: string // type === 'link' (video/externé)
  mediaKey?: string // type === 'file' — privátna Blob URL (bez tokenu nečitateľná)
  fileName?: string
  mediaSize?: number
  published: boolean
  order: number
  updatedAt: string
}

export interface CmsData {
  categories: Category[]
  items: PremiumItem[]
  books: Book[]
  places: Place[]
  monthly: MonthlyEdit
}
