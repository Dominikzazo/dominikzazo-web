import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

// DOČASNÝ health-check — overí, že KV je v prode napojený. Po overení zmazať.
export async function GET() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return NextResponse.json({ ok: false, reason: 'env chýba' }, { status: 500 })
  try {
    const redis = new Redis({ url, token })
    const stamp = Date.now()
    await redis.set('newsletter:_ping', stamp)
    const got = await redis.get<number>('newsletter:_ping')
    await redis.del('newsletter:_ping')
    return NextResponse.json({ ok: got === stamp, roundtrip: got === stamp })
  } catch (err) {
    return NextResponse.json({ ok: false, reason: String(err) }, { status: 500 })
  }
}
