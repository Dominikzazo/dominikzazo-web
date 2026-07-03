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

export async function addItem(formData: FormData) {
  await requireAdmin()
  const type = String(formData.get('type')) === 'link' ? 'link' : 'article'
  const categoryId = String(formData.get('categoryId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  if (!title || !categoryId) return
  await upsertItem({
    categoryId,
    type,
    title,
    excerpt: String(formData.get('excerpt') ?? '').trim(),
    body: type === 'article' ? String(formData.get('body') ?? '') : undefined,
    url: type === 'link' ? String(formData.get('url') ?? '').trim() : undefined,
    published: formData.get('published') === 'on',
  })
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
