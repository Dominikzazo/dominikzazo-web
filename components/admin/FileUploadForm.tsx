'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { createFileItem } from '@/app/clenska/admin/kruh/actions'

const input =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]'

export default function FileUploadForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const file = fd.get('file') as File | null
    const title = String(fd.get('title') ?? '').trim()
    if (!file || file.size === 0 || !title) {
      setError('Vyber súbor a zadaj názov.')
      return
    }
    setBusy(true)
    try {
      // Súbor ide priamo do private Blobu (token vydá /api/admin/upload len adminovi)
      const blob = await upload(`kruh/${file.name}`, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/upload',
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      })
      await createFileItem({
        categoryId: String(fd.get('categoryId')),
        title,
        excerpt: String(fd.get('excerpt') ?? '').trim(),
        mediaKey: blob.url,
        fileName: file.name,
        mediaSize: file.size,
        published: fd.get('published') === 'on',
      })
      formRef.current?.reset()
      setProgress(0)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-white/50 p-5">
      <h3 className="font-lora text-[16px]">Nahrať súbor (PDF, audio, video…)</h3>
      <input name="title" placeholder="Názov (napr. Sprievodca tichom)" required className={input} />
      <div className="flex gap-3">
        <select name="categoryId" className={input}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="excerpt" placeholder="Krátky popis" className={input} />
      </div>
      <input type="file" name="file" required className="text-[13px]" />
      <label className="flex items-center gap-2 text-[13px] text-[#666]">
        <input type="checkbox" name="published" /> publikovať hneď
      </label>
      {busy && (
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#c9a96e' }} />
        </div>
      )}
      {error && <p className="text-[12px] text-[#c66]">{error}</p>}
      <button
        disabled={busy}
        className="self-start rounded-full bg-[#c9a96e] px-5 py-2 text-[13.5px] font-medium text-[#1a1a1a] hover:bg-[#b8985d] disabled:opacity-50"
      >
        {busy ? `Nahrávam… ${progress}%` : '⬆ Nahrať a uložiť'}
      </button>
      <p className="text-[11px] text-[#999]">
        Veľké/HD videá radšej hosťuj ako unlisted na YouTube a pridaj ich ako „Odkaz" — šetrí to prenos.
      </p>
    </form>
  )
}
