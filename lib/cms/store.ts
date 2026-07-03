import { put, list } from '@vercel/blob'
import type { CmsData } from './types'

// Tenká vrstva nad úložiskom (Vercel Blob, private store `kruh-cms`).
// Celý CMS volá readData/writeData — ak raz vymeníme backend (Neon a pod.),
// meníme len tento súbor. Rovnaká filozofia ako getMember() nad Clerk.

const PATH = 'cms/data.json'

const SEED: CmsData = {
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

export async function readData(): Promise<CmsData> {
  const t = token()
  if (!t) return SEED
  try {
    const { blobs } = await list({ prefix: PATH, token: t, limit: 1 })
    const blob = blobs.find((b) => b.pathname === PATH)
    if (!blob) return SEED
    const res = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    })
    if (!res.ok) return SEED
    const data = (await res.json()) as CmsData
    return { categories: data.categories ?? [], items: data.items ?? [] }
  } catch {
    return SEED
  }
}

export async function writeData(data: CmsData): Promise<void> {
  const t = token()
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN chýba — úložisko nie je nakonfigurované.')
  await put(PATH, JSON.stringify(data, null, 2), {
    access: 'private',
    token: t,
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
  })
}
