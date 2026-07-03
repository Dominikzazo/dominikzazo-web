import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import { getItem } from '@/lib/cms/premium'

export default async function ObsahReader({ params }: { params: Promise<{ id: string }> }) {
  const member = await getMember()
  if (!member.isAuthed) redirect('/sign-in')

  const { id } = await params
  const item = await getItem(id)
  // Nečlen/neexistujúce/skryté → 404 (admin vidí aj nepublikované)
  if (!item || item.type !== 'article' || (!item.published && !member.isAdmin)) notFound()

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] page-pad flex flex-col items-center">
      <div className="w-full max-w-[640px] mb-10">
        <Link
          href="/clenska/obsah"
          className="text-[13px] text-[#888] hover:text-[#1a1a1a] no-underline"
        >
          ← obsah
        </Link>
      </div>

      <article className="w-full max-w-[640px]">
        <p
          className="text-[11px] font-medium tracking-[0.28em] uppercase mb-4"
          style={{ color: '#a8843f' }}
        >
          ✦ Kruh
        </p>
        <h1 className="font-lora text-[32px] sm:text-[40px] leading-[1.2] mb-6">{item.title}</h1>
        {!item.published && (
          <p className="mb-6 text-[12px] text-[#c66]">(nepublikované — vidíš to len ako admin)</p>
        )}
        <div className="article-content whitespace-pre-wrap">{item.body}</div>
      </article>
    </main>
  )
}
