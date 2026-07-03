'use server'

import { revalidatePath } from 'next/cache'
import { getMember } from '@/lib/members/session'
import { upsertPlace, deletePlace } from '@/lib/cms/public'
import type { PlaceStatus } from '@/lib/cms/types'

async function requireAdmin() {
  const m = await getMember()
  if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')
}

function revalidate() {
  revalidatePath('/clenska/admin/mapa')
  revalidatePath('/')
}

const STATUSES: PlaceStatus[] = ['home', 'visited', 'last', 'wishlist']

export async function savePlace(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const statusRaw = String(formData.get('status') ?? '')
  const id = String(formData.get('id') ?? '') || undefined
  await upsertPlace({
    id,
    name,
    lon: Number(formData.get('lon')) || 0,
    lat: Number(formData.get('lat')) || 0,
    status: (STATUSES as string[]).includes(statusRaw) ? (statusRaw as PlaceStatus) : 'wishlist',
    emoji: String(formData.get('emoji') ?? '📍').trim() || '📍',
    note: String(formData.get('note') ?? '').trim(),
    onMap: formData.get('onMap') === 'on',
  })
  revalidate()
}

export async function removePlace(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (id) await deletePlace(id)
  revalidate()
}
