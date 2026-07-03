import { randomUUID } from 'node:crypto'
import { readData, writeData } from './store'
import type { Category, PremiumItem } from './types'

// CRUD nad premium (Kruh) obsahom. Volá sa z admin server actions a z /clenska/obsah.

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function listCategories(): Promise<Category[]> {
  const d = await readData()
  return [...d.categories].sort((a, b) => a.order - b.order)
}

export async function listItems(): Promise<PremiumItem[]> {
  const d = await readData()
  return [...d.items].sort((a, b) => a.order - b.order)
}

export async function getItem(id: string): Promise<PremiumItem | null> {
  const d = await readData()
  return d.items.find((i) => i.id === id) ?? null
}

export async function upsertCategory(input: { id?: string; name: string }): Promise<void> {
  const d = await readData()
  if (input.id) {
    d.categories = d.categories.map((c) =>
      c.id === input.id ? { ...c, name: input.name, slug: slugify(input.name) } : c,
    )
  } else {
    d.categories.push({
      id: randomUUID(),
      name: input.name,
      slug: slugify(input.name),
      order: d.categories.length,
    })
  }
  await writeData(d)
}

export async function deleteCategory(id: string): Promise<void> {
  const d = await readData()
  d.categories = d.categories.filter((c) => c.id !== id)
  d.items = d.items.filter((i) => i.categoryId !== id)
  await writeData(d)
}

export async function upsertItem(input: {
  id?: string
  categoryId: string
  type: PremiumItem['type']
  title: string
  excerpt?: string
  body?: string
  url?: string
  published?: boolean
}): Promise<void> {
  const d = await readData()
  const now = new Date().toISOString()
  if (input.id) {
    d.items = d.items.map((i) =>
      i.id === input.id
        ? {
            ...i,
            categoryId: input.categoryId,
            type: input.type,
            title: input.title,
            excerpt: input.excerpt ?? '',
            body: input.body,
            url: input.url,
            published: input.published ?? i.published,
            updatedAt: now,
          }
        : i,
    )
  } else {
    d.items.push({
      id: randomUUID(),
      categoryId: input.categoryId,
      type: input.type,
      title: input.title,
      excerpt: input.excerpt ?? '',
      body: input.body,
      url: input.url,
      published: input.published ?? false,
      order: d.items.length,
      updatedAt: now,
    })
  }
  await writeData(d)
}

export async function deleteItem(id: string): Promise<void> {
  const d = await readData()
  d.items = d.items.filter((i) => i.id !== id)
  await writeData(d)
}
