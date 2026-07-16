import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import { getItem } from '@/lib/cms/premium'
import { fileKind, embedUrl } from '@/lib/cms/media'
import type { PremiumItem } from '@/lib/cms/types'

// Čítačka/prehrávač premium obsahu. Rieši VŠETKY typy — text, nahraté súbory
// (video/audio/PDF) aj odkazy (YouTube/Vimeo embed) — nech sa obsah prehrá
// priamo tu, nie v cudzom tabe.

function FileBody({ item }: { item: PremiumItem }) {
  const src = `/clenska/media/${item.id}`
  const kind = fileKind(item.fileName)

  if (kind === 'video') {
    return <video controls playsInline preload="metadata" src={src} className="w-full rounded-2xl bg-black" />
  }

  if (kind === 'audio') {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white/60 p-5">
        <audio controls preload="metadata" src={src} className="w-full" />
      </div>
    )
  }

  if (kind === 'pdf') {
    return (
      <div className="flex flex-col gap-3">
        <iframe
          src={src}
          title={item.title}
          className="h-[75vh] w-full rounded-2xl border border-black/[0.07] bg-white"
        />
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-[#a8843f] no-underline hover:underline"
        >
          Otvoriť v novom okne ↗
        </a>
      </div>
    )
  }

  return (
    <a
      href={src}
      className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white/60 p-5 no-underline transition-colors hover:border-[#c9a96e]/50"
    >
      <span className="text-[22px]">⬇</span>
      <span>
        <span className="block text-[15px] font-medium text-[#1a1a1a]">
          {item.fileName ?? 'Stiahnuť súbor'}
        </span>
        {item.mediaSize ? (
          <span className="block text-[12px] text-[#999]">
            {(item.mediaSize / 1024 / 1024).toFixed(1)} MB
          </span>
        ) : null}
      </span>
    </a>
  )
}

function LinkBody({ item }: { item: PremiumItem }) {
  const embed = item.url ? embedUrl(item.url) : null

  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={embed}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white/60 p-5 no-underline transition-colors hover:border-[#c9a96e]/50"
    >
      <span className="text-[22px]">🔗</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-[#1a1a1a]">Otvoriť odkaz ↗</span>
        <span className="block truncate text-[12px] text-[#999]">{item.url}</span>
      </span>
    </a>
  )
}

export default async function ObsahReader({ params }: { params: Promise<{ id: string }> }) {
  const member = await getMember()
  if (!member.isAuthed) redirect('/sign-in')

  const { id } = await params
  const item = await getItem(id)
  // Nečlen/neexistujúce/skryté → 404 (admin vidí aj nepublikované)
  if (!item || (!item.published && !member.isAdmin)) notFound()

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

        {item.type === 'article' ? (
          <div className="article-content whitespace-pre-wrap">{item.body}</div>
        ) : (
          <>
            {item.excerpt && (
              <p className="mb-6 text-[16px] leading-[1.7] text-[#666]">{item.excerpt}</p>
            )}
            {item.type === 'file' ? <FileBody item={item} /> : <LinkBody item={item} />}
          </>
        )}
      </article>
    </main>
  )
}
