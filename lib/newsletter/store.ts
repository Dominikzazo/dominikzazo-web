import { put, list, del } from '@vercel/blob'
import type { NewsletterData } from './types'
import { EMPTY_NEWSLETTER_DATA } from './types'

// Verziovaný Blob store — rovnaká filozofia ako lib/cms/store.ts.
// Zápis = nová cesta newsletter/data-<ts>.json (unikátna URL obchádza CDN cache).

const PREFIX = 'newsletter/data'
const KEEP_VERSIONS = 5

function token(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN
}

type BlobMeta = { url: string; pathname: string; uploadedAt: string | Date }

async function listVersions(t: string): Promise<BlobMeta[]> {
  const { blobs } = await list({ prefix: PREFIX, token: t })
  return (blobs as BlobMeta[]).sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
}

export async function readData(): Promise<NewsletterData> {
  const t = token()
  if (!t) return EMPTY_NEWSLETTER_DATA
  try {
    const versions = await listVersions(t)
    if (versions.length === 0) return EMPTY_NEWSLETTER_DATA
    const res = await fetch(versions[0].url, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    })
    if (!res.ok) return EMPTY_NEWSLETTER_DATA
    const data = (await res.json()) as Partial<NewsletterData>
    return {
      sequences: data.sequences ?? [],
      enrollments: data.enrollments ?? [],
      events: data.events ?? [],
    }
  } catch {
    return EMPTY_NEWSLETTER_DATA
  }
}

export async function writeData(data: NewsletterData): Promise<void> {
  const t = token()
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN chýba — úložisko nie je nakonfigurované.')
  await put(`${PREFIX}-${Date.now()}.json`, JSON.stringify(data, null, 2), {
    access: 'private',
    token: t,
    addRandomSuffix: true,
    contentType: 'application/json',
  })
  try {
    const versions = await listVersions(t)
    const old = versions.slice(KEEP_VERSIONS).map((v) => v.url)
    if (old.length > 0) await del(old, { token: t })
  } catch {
    // upratovanie nesmie zhodiť zápis
  }
}
