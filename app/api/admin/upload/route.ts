import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getMember } from '@/lib/members/session'

// Token-exchange pre client-side upload do private Blob store (kruh-cms).
// Súbor ide z prehliadača priamo do Blobu (obchádza 4,5MB limit funkcií);
// táto route len vydá krátkodobý token — a LEN adminovi.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const m = await getMember()
        if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB strop
        }
      },
      onUploadCompleted: async () => {
        // metadáta ukladá klient cez server action po dokončení uploadu
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
