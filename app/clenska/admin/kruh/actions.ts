'use server'

import { revalidatePath } from 'next/cache'
import { getMember } from '@/lib/members/session'
import {
  upsertCategory,
  deleteCategory,
  upsertItem,
  deleteItem,
  getItem,
} from '@/lib/cms/premium'

// Gating vrstva 3: každá mutácia znova overí admina (nikdy nespoliehaj na skryté UI).
async function requireAdmin() {
  const m = await getMember()
  if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')
}

function revalidate() {
  revalidatePath('/clenska/admin/kruh')
  revalidatePath('/clenska/obsah')
}

export async function addCategory(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  if (name) await upsertCategory({ name })
  revalidate()
}

export async function removeCategory(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (id) await deleteCategory(id)
  revalidate()
}

// Vytvorenie aj úprava položky (vzor ako saveBook): skryté `id` = úprava.
// Pri úprave sa typ ani mediálne polia (mediaKey/fileName/mediaSize) nemenia —
// mení sa len to, čo je vo formulári.
export async function saveItem(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const categoryId = String(formData.get('categoryId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const published = formData.get('published') === 'on'
  if (!title || !categoryId) return

  if (id) {
    const existing = await getItem(id)
    if (!existing) return
    await upsertItem({
      ...existing,
      categoryId,
      title,
      excerpt,
      body: existing.type === 'article' ? String(formData.get('body') ?? '') : existing.body,
      url: existing.type === 'link' ? String(formData.get('url') ?? '').trim() : existing.url,
      published,
    })
    revalidatePath(`/clenska/obsah/${id}`)
  } else {
    const type = String(formData.get('type')) === 'link' ? 'link' : 'article'
    await upsertItem({
      categoryId,
      type,
      title,
      excerpt,
      body: type === 'article' ? String(formData.get('body') ?? '') : undefined,
      url: type === 'link' ? String(formData.get('url') ?? '').trim() : undefined,
      published,
    })
  }
  revalidate()
}

// Volané z client upload komponentu po dokončení uploadu do Blobu
export async function createFileItem(data: {
  categoryId: string
  title: string
  excerpt: string
  mediaKey: string
  fileName: string
  mediaSize: number
  published: boolean
}) {
  await requireAdmin()
  if (!data.title || !data.categoryId || !data.mediaKey) return
  await upsertItem({ ...data, type: 'file' })
  revalidate()
}

export async function removeItem(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (id) await deleteItem(id)
  revalidate()
}

export async function togglePublish(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const item = await getItem(id)
  if (item) await upsertItem({ ...item, published: !item.published })
  revalidate()
}
