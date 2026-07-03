'use server'

import { revalidatePath } from 'next/cache'
import { getMember } from '@/lib/members/session'
import { upsertBook, deleteBook } from '@/lib/cms/public'
import type { BookStatus } from '@/lib/cms/types'

async function requireAdmin() {
  const m = await getMember()
  if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')
}

function revalidate() {
  revalidatePath('/clenska/admin/knihy')
  revalidatePath('/')
}

const STATUSES: BookStatus[] = ['práve čítam', 'prečítané', 'chcem čítať']

export async function saveBook(formData: FormData) {
  await requireAdmin()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const statusRaw = String(formData.get('status') ?? '')
  const yearRaw = String(formData.get('year') ?? '').trim()
  const id = String(formData.get('id') ?? '') || undefined
  await upsertBook({
    id,
    title,
    author: String(formData.get('author') ?? '').trim(),
    status: (STATUSES as string[]).includes(statusRaw) ? (statusRaw as BookStatus) : 'chcem čítať',
    year: yearRaw ? Number(yearRaw) || null : null,
    note: String(formData.get('note') ?? '').trim() || null,
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  })
  revalidate()
}

export async function removeBook(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (id) await deleteBook(id)
  revalidate()
}
