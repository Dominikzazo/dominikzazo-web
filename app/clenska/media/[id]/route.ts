import { getMember } from '@/lib/members/session'
import { getItem } from '@/lib/cms/premium'

// Gated servírovanie premium súborov: over členstvo → fetchni private blob
// na serveri (s tokenom) → streamni bajty. Blob URL sa klientovi nikdy nedáva.
//
// Range hlavičky preposielame ďalej — bez toho <video> nevie pretáčať
// (prehliadač pýta byte-range; Blob ich podporuje, my ich len prepošleme
// aj s odpoveďou 206 a Content-Range).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember()
  if (!member.isAuthed) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const item = await getItem(id)
  if (!item || item.type !== 'file' || !item.mediaKey) return new Response('Not found', { status: 404 })
  if (!item.published && !member.isAdmin) return new Response('Not found', { status: 404 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return new Response('Storage not configured', { status: 500 })

  const range = req.headers.get('range')
  const upstream = await fetch(item.mediaKey, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
  })
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 })

  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodeURIComponent(item.fileName ?? 'subor')}"`,
    'Cache-Control': 'private, no-store',
    'Accept-Ranges': 'bytes',
  })
  for (const h of ['content-range', 'content-length']) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }

  // 206 pri čiastočnom obsahu, inak 200
  return new Response(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers })
}
