// Zdroj pravdy pre typy CMS obsahu. Zvyšok appky ich importuje odtiaľto.

export interface Category {
  id: string
  name: string
  slug: string
  order: number
}

export type PremiumType = 'article' | 'link'

export interface PremiumItem {
  id: string
  categoryId: string
  type: PremiumType
  title: string
  excerpt: string
  body?: string // type === 'article'
  url?: string // type === 'link' (video/pdf/externé)
  published: boolean
  order: number
  updatedAt: string
}

export interface CmsData {
  categories: Category[]
  items: PremiumItem[]
}
