import { NextResponse } from 'next/server'
import { getMember } from '@/lib/members/session'
import { readData, writeData } from '@/lib/newsletter/store'
import type { Sequence } from '@/lib/newsletter/types'

export const runtime = 'nodejs'

async function requireAdmin(): Promise<boolean> {
  const m = await getMember()
  return m.isAdmin
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const data = await readData()
  return NextResponse.json({ sequences: data.sequences })
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let body: { sequences?: Sequence[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!Array.isArray(body.sequences)) {
    return NextResponse.json({ error: 'sequences required' }, { status: 400 })
  }
  const data = await readData()
  await writeData({ ...data, sequences: body.sequences })
  return NextResponse.json({ ok: true })
}
