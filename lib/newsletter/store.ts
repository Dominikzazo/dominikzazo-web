import { Redis } from '@upstash/redis'
import type { NewsletterData } from './types'
import { EMPTY_NEWSLETTER_DATA } from './types'

// Newsletter dáta žijú v Upstash Redise (KV napojený na dominikzazo.sk).
// Predtým to bol Vercel Blob, ale ten na Hobby pláne narazil na strop
// „advanced operations" (list pri každom čítaní) a store sa zablokoval.
// Redis: jeden kľúč, O(1) get/set, žiadny operačný strop pri tomto objeme.
const KEY = 'newsletter:data'

function client(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

// Doplní chýbajúce polia (spätná kompatibilita so staršími záznamami bez events).
export function normalizeData(raw: unknown): NewsletterData {
  const d = (raw ?? {}) as Partial<NewsletterData>
  return {
    sequences: d.sequences ?? [],
    enrollments: d.enrollments ?? [],
    events: d.events ?? [],
  }
}

export async function readData(): Promise<NewsletterData> {
  const redis = client()
  if (!redis) return EMPTY_NEWSLETTER_DATA
  try {
    // @upstash/redis automaticky deserializuje JSON.
    const raw = await redis.get<NewsletterData>(KEY)
    return normalizeData(raw)
  } catch (err) {
    console.error('newsletter store read failed', err)
    return EMPTY_NEWSLETTER_DATA
  }
}

export async function writeData(data: NewsletterData): Promise<void> {
  const redis = client()
  if (!redis) throw new Error('KV nie je nakonfigurovaný — úložisko chýba.')
  await redis.set(KEY, data)
}
