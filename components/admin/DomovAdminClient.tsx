'use client'

import { useState, useRef, useTransition } from 'react'
import type { HomepageData, AboutData } from '@/lib/cms/types'
import { saveHomepage, saveAbout } from '@/app/clenska/admin/domov/actions'

interface Props {
  initialHome: HomepageData
  initialAbout: AboutData
}

// ── Pomocná funkcia na renderovanie formátovaného textu (náhľad) ──
function FormattedPreview({ text }: { text: string }) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <div className="rounded-lg border border-black/[0.06] bg-[#fafaf8] p-3 text-[14px] leading-relaxed text-[#333]">
      <div className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-[#aaa]">
        Živý náhľad textu:
      </div>
      <div>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-semibold text-[#1a1a1a]">
                {part.slice(2, -2)}
              </strong>
            )
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={i} className="font-serif italic text-[#444]">
                {part.slice(1, -1)}
              </em>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
    </div>
  )
}

// ── Lišta s nástrojmi na formátovanie (Bold, Italic, Emojis) ──
function FormatToolbar({
  textareaRef,
  onUpdate,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onUpdate?: (newVal: string) => void
}) {
  function applyWrap(prefix: string, suffix = prefix, placeholder = 'text') {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = el.value
    const selected = val.slice(start, end)
    const insertion = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`
    const updated = val.slice(0, start) + insertion + val.slice(end)
    el.value = updated
    if (onUpdate) onUpdate(updated)

    el.focus()
    const nextCursor = selected ? start + insertion.length : start + prefix.length
    el.setSelectionRange(nextCursor, nextCursor + (selected ? 0 : placeholder.length))
  }

  function insertText(str: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = el.value
    const updated = val.slice(0, start) + str + val.slice(end)
    el.value = updated
    if (onUpdate) onUpdate(updated)

    el.focus()
    const nextCursor = start + str.length
    el.setSelectionRange(nextCursor, nextCursor)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-1 text-[12px]">
      <span className="mr-1 text-[11px] font-medium text-[#aaa]">Formát:</span>
      <button
        type="button"
        onClick={() => applyWrap('**', '**', 'hrubý text')}
        className="rounded border border-black/[0.08] bg-white px-2 py-0.5 font-bold hover:bg-black/[0.04]"
        title="Tučné písmo (**text**)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => applyWrap('*', '*', 'kurzíva')}
        className="rounded border border-black/[0.08] bg-white px-2 py-0.5 font-serif italic hover:bg-black/[0.04]"
        title="Kurzíva (*text*)"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => applyWrap('„', '“', 'citát')}
        className="rounded border border-black/[0.08] bg-white px-2 py-0.5 hover:bg-black/[0.04]"
        title="Úvodzovky („text“)"
      >
        „ “
      </button>

      <span className="mx-1 text-black/[0.15]">|</span>

      <span className="mr-1 text-[11px] font-medium text-[#aaa]">Emoji:</span>
      {['☕', '🚄', '🌿', '🟠', '📖', '🙏', '🏐'].map((em) => (
        <button
          key={em}
          type="button"
          onClick={() => insertText(em)}
          className="rounded border border-black/[0.08] bg-white px-1.5 py-0.5 hover:bg-black/[0.04]"
        >
          {em}
        </button>
      ))}
    </div>
  )
}

// ── Klientska kompresia obrázka (vyhne sa 4.5MB limitu funkcie) ──
async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width <= maxDim && height <= maxDim && file.size < 1.5 * 1024 * 1024) {
        return resolve(file)
      }
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(file)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(newFile)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

// ── Komponent pre nahrávanie fotky s náhľadom ──
function ImageUploadField({
  name,
  label,
  initialValue,
  placeholder,
}: {
  name: string
  label: string
  initialValue: string
  placeholder?: string
}) {
  const [value, setValue] = useState(initialValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(false)
    setUploading(true)

    try {
      const processed = await compressImage(file)
      const fd = new FormData()
      fd.append('file', processed)

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Nahrávanie zlyhalo.')
      }

      setValue(data.url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/[0.07] bg-white/50 p-4">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium text-[#777]">{label}</label>
        {uploading && (
          <span className="text-[11px] font-medium text-[#c9a96e] animate-pulse">
            ⏳ Nahrávam z PC…
          </span>
        )}
        {success && (
          <span className="text-[11px] font-medium text-[#5a9a5e]">
            ✓ Fotka bola úspešne nahraná!
          </span>
        )}
        {error && <span className="text-[11px] text-[#c66]">{error}</span>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Náhľad fotky */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.1] bg-[#f5f5f3] shadow-inner">
          {value ? (
            <img
              src={value}
              alt="Náhľad"
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <span className="text-[20px] text-[#ccc]">📷</span>
          )}
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white backdrop-blur-sm">
            náhľad
          </span>
        </div>

        {/* Input a tlačidlo uploadu */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <input
              name={name}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder || 'URL adresa fotky (napr. /uploads/...)'}
              className="flex-1 rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#c9a96e]"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[12.5px] font-medium text-[#333] hover:bg-[#f7f7f5] active:scale-[0.98] disabled:opacity-50"
            >
              <span>📁</span>
              <span className="hidden sm:inline">Nahrať z PC</span>
            </button>
          </div>

          <p className="text-[11px] text-[#999]">
            Môžeš nahrať fotku z počítača (automaticky sa optimalizuje) alebo priamo zadať URL.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

// ── Accordion sekcia (harmonika) ──
function AccordionSection({
  title,
  subtitle,
  badge,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  subtitle: string
  badge?: string
  icon: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white/70 transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-black/[0.015]"
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fafaf8] text-[20px] shadow-sm">
            {icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-lora text-[18px] font-medium text-[#1a1a1a]">{title}</h2>
              {badge && (
                <span className="rounded-full bg-[#f0ede6] px-2.5 py-0.5 text-[11px] font-medium text-[#8a7243]">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#777]">{subtitle}</p>
          </div>
        </div>
        <span className="text-[14px] text-[#aaa] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-black/[0.06] p-6 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Textarea s formátovacou lištou a náhľadom ──
function TextareaWithToolbar({
  name,
  label,
  defaultValue,
  rows = 3,
  placeholder,
  hint,
}: {
  name: string
  label: string
  defaultValue: string
  rows?: number
  placeholder?: string
  hint?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [val, setVal] = useState(defaultValue)
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium text-[#888]">{label}</label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-[11px] text-[#a8843f] hover:underline"
        >
          {showPreview ? 'Skryť náhľad' : 'Zobraziť náhľad'}
        </button>
      </div>

      <FormatToolbar textareaRef={ref} onUpdate={setVal} />

      <textarea
        ref={ref}
        name={name}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
      />

      {hint && <p className="text-[11px] text-[#aaa]">{hint}</p>}

      {showPreview && val && <FormattedPreview text={val} />}
    </div>
  )
}

export default function DomovAdminClient({ initialHome, initialAbout }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    bento: true,
    about: false,
    facts: false,
  })

  const [isPendingHome, startTransitionHome] = useTransition()
  const [isPendingAbout, startTransitionAbout] = useTransition()
  const [homeSaved, setHomeSaved] = useState(false)
  const [aboutSaved, setAboutSaved] = useState(false)

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function expandAll() {
    setOpenSections({ hero: true, bento: true, about: true, facts: true })
  }

  function collapseAll() {
    setOpenSections({ hero: false, bento: false, about: false, facts: false })
  }

  async function handleHomeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransitionHome(async () => {
      await saveHomepage(fd)
      setHomeSaved(true)
      setTimeout(() => setHomeSaved(false), 3500)
    })
  }

  async function handleAboutSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransitionAbout(async () => {
      await saveAbout(fd)
      setAboutSaved(true)
      setTimeout(() => setAboutSaved(false), 3500)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Rýchle ovládanie harmoniky */}
      <div className="flex items-center justify-between text-[12px] text-[#888]">
        <span>Harmonika sekcií:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 hover:bg-black/[0.04]"
          >
             Rozbaliť všetko
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 hover:bg-black/[0.04]"
          >
             Zbaliť všetko
          </button>
        </div>
      </div>

      {/* ── 1. FORMULÁR PRE HOMEPAGE ── */}
      <form onSubmit={handleHomeSubmit} className="flex flex-col gap-4">
        {/* Harmonika 1: Hero Úvod */}
        <AccordionSection
          title="Hero Úvod & Motto"
          subtitle="Pozdrav, úvodné odseky a hlavný tagline na homepage"
          badge="Homepage"
          icon="🏡"
          isOpen={!!openSections.hero}
          onToggle={() => toggleSection('hero')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[12px] font-medium text-[#888]">Hlavný pozdrav (H1)</p>
              <input
                name="greeting"
                defaultValue={initialHome.greeting}
                className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
              />
            </div>

            <TextareaWithToolbar
              name="bio1"
              label="1. odsek (Vek, káva, life advice)"
              defaultValue={initialHome.bio1}
              rows={3}
              hint="Použi **bold** pre hrubé písmo v kľúčových slovách."
            />

            <TextareaWithToolbar
              name="bio2"
              label="2. odsek (Spomalenie, žurnál, vlaky)"
              defaultValue={initialHome.bio2}
              rows={3}
            />

            <TextareaWithToolbar
              name="tagline"
              label="Spodný záver / Motto (Tagline)"
              defaultValue={initialHome.tagline}
              rows={2}
            />
          </div>
        </AccordionSection>

        {/* Harmonika 2: Bento Grid */}
        <AccordionSection
          title="Bento Grid & Kartičky"
          subtitle="Status „○ teraz“, citát a dve fotografie v mriežke"
          badge="Bento"
          icon="🍱"
          isOpen={!!openSections.bento}
          onToggle={() => toggleSection('bento')}
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-1 text-[12px] font-medium text-[#888]">Kartička: ○ teraz</p>
              <input
                name="nowText"
                defaultValue={initialHome.nowText}
                placeholder="Teraz: ..."
                className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
              />
              <p className="mt-1 text-[11px] text-[#aaa]">Aktuálny status (napr. čo práve robíš, piješ, plánuješ).</p>
            </div>

            <div>
              <p className="mb-1 text-[12px] font-medium text-[#888]">Kartička: Citát</p>
              <input
                name="quoteText"
                defaultValue={initialHome.quoteText}
                className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
              />
            </div>

            <div>
              <p className="mb-1 text-[12px] font-medium text-[#888]">Tagy k citátu (oddelené čiarkou)</p>
              <input
                name="quoteTags"
                defaultValue={initialHome.quoteTags.join(', ')}
                className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
              />
            </div>

            <div className="border-t border-black/[0.06] pt-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Fotografia 1 (Bento hore)</h3>
              <ImageUploadField
                name="photo1Src"
                label="Zdroj obrázka"
                initialValue={initialHome.photo1Src}
              />
              <div className="mt-2">
                <p className="text-[12px] font-medium text-[#888]">Popisok / Alt fotky 1</p>
                <input
                  name="photo1Label"
                  defaultValue={initialHome.photo1Label}
                  className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#c9a96e]"
                />
              </div>
            </div>

            <div className="border-t border-black/[0.06] pt-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Fotografia 2 (Bento dole)</h3>
              <ImageUploadField
                name="photo2Src"
                label="Zdroj obrázka"
                initialValue={initialHome.photo2Src}
              />
              <div className="mt-2">
                <p className="text-[12px] font-medium text-[#888]">Popisok / Alt fotky 2</p>
                <input
                  name="photo2Label"
                  defaultValue={initialHome.photo2Label}
                  className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#c9a96e]"
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Tlačidlo uloženia pre Homepage */}
        <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
          <button
            type="submit"
            disabled={isPendingHome}
            className="rounded-full bg-[#c9a96e] px-6 py-2.5 text-[14px] font-medium text-[#1a1a1a] shadow-sm hover:bg-[#b8985d] active:scale-[0.98] disabled:opacity-50"
          >
            {isPendingHome ? 'Ukladám domov…' : '✓ Uložiť domovskú stránku'}
          </button>
          {homeSaved && (
            <span className="text-[13px] font-medium text-[#5a9a5e]">
              ✓ Zmeny na domovskej stránke boli uložené!
            </span>
          )}
        </div>
      </form>

      {/* ── 2. FORMULÁR PRE O MNE ── */}
      <form onSubmit={handleAboutSubmit} className="flex flex-col gap-4 pt-4">
        {/* Harmonika 3: O mne Bio & Profilovka */}
        <AccordionSection
          title="O mne: Príbeh & Profilovka"
          subtitle="Podrobné bio odseky a hlavná portrétna fotografia"
          badge="O mne"
          icon="👤"
          isOpen={!!openSections.about}
          onToggle={() => toggleSection('about')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[12px] font-medium text-[#888]">Nadpis sekcie</p>
              <input
                name="title"
                defaultValue={initialAbout.title}
                className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c9a96e]"
              />
            </div>

            <TextareaWithToolbar
              name="bio1"
              label="1. odsek (Ahoj som Dominik...)"
              defaultValue={initialAbout.bio1}
              rows={2}
            />

            <TextareaWithToolbar
              name="bio2"
              label="2. odsek (Ráno, Chemex, Amityage, Bitcoin)"
              defaultValue={initialAbout.bio2}
              rows={2}
            />

            <TextareaWithToolbar
              name="bio3"
              label="3. odsek (Mariánska mládež, volejbal, Kofola)"
              defaultValue={initialAbout.bio3}
              rows={2}
            />

            <TextareaWithToolbar
              name="bio4"
              label="4. odsek (Havajské košele, Traja pátrači)"
              defaultValue={initialAbout.bio4}
              rows={2}
            />

            <div className="border-t border-black/[0.06] pt-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Hlavná portrétna fotka</h3>
              <ImageUploadField
                name="photoSrc"
                label="Zdroj profilovky"
                initialValue={initialAbout.photoSrc}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Harmonika 4: Fakty o mne */}
        <AccordionSection
          title="Zaujímavé fakty (Fun Facts)"
          subtitle="9 kartičiek s emoji a popisom v sekcii O mne"
          badge={`${initialAbout.facts.length} faktov`}
          icon="✨"
          isOpen={!!openSections.facts}
          onToggle={() => toggleSection('facts')}
        >
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-medium text-[#888]">
              Zoznam faktov — jeden riadok vo formáte: <code className="rounded bg-black/[0.05] px-1 py-0.5">emoji | Názov | Popis</code>
            </p>
            <textarea
              name="facts"
              defaultValue={initialAbout.facts.map((f) => `${f.emoji} | ${f.title} | ${f.desc}`).join('\n')}
              rows={10}
              className="w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[#c9a96e]"
            />
            <p className="text-[11px] text-[#999]">
              Príklad: ☕ | Chemex adept | Pomalá káva pre pomalý deň.
            </p>
          </div>
        </AccordionSection>

        {/* Tlačidlo uloženia pre O mne */}
        <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
          <button
            type="submit"
            disabled={isPendingAbout}
            className="rounded-full bg-[#c9a96e] px-6 py-2.5 text-[14px] font-medium text-[#1a1a1a] shadow-sm hover:bg-[#b8985d] active:scale-[0.98] disabled:opacity-50"
          >
            {isPendingAbout ? 'Ukladám O mne…' : '✓ Uložiť sekciu O mne'}
          </button>
          {aboutSaved && (
            <span className="text-[13px] font-medium text-[#5a9a5e]">
              ✓ Zmeny v sekcii O mne boli uložené!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
