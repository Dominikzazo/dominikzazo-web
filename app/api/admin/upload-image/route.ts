import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getMember } from '@/lib/members/session'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN nie je nakonfigurovaný.' }, { status: 500 })

  let file: File | null = null
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (f instanceof File) file = f
  } catch {
    return NextResponse.json({ error: 'Neplatný upload formát.' }, { status: 400 })
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Chýba súbor.' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Nahrajte platný obrázok (JPG, PNG, WebP).' }, { status: 400 })
  }

  const safeName = (file.name || 'image.jpg')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  try {
    const blob = await put(`uploads/${Date.now()}-${safeName}`, file, {
      access: 'public',
      token,
      addRandomSuffix: true,
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('Image upload failed:', err)
    return NextResponse.json({ error: 'Nahrávanie obrázka zlyhalo.' }, { status: 502 })
  }
}
