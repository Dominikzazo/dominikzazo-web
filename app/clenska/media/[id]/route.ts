import { getMember } from '@/lib/members/session'
import { getItem } from '@/lib/cms/premium'

// Gated servírovanie premium súborov: over členstvo → fetchni private blob
// na serveri (s tokenom) → streamni bajty. Blob URL sa klientovi nikdy nedáva.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember()
  if (!member.isAuthed) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const item = await getItem(id)
  if (!item || item.type !== 'file' || !item.mediaKey) return new Response('Not found', { status: 404 })
  if (!item.published && !member.isAdmin) return new Response('Not found', { status: 404 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return new Response('Storage not configured', { status: 500 })

  const upstream = await fetch(item.mediaKey, { headers: { Authorization: `Bearer ${token}` } })
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(item.fileName ?? 'subor')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
