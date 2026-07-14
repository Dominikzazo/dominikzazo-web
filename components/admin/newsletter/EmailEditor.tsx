'use client'
import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import type { SequenceEmail } from '@/lib/newsletter/types'
import { Btn, BTC, BTC_LIGHT, BTC_BORDER, COLORS, inputStyle, labelStyle } from './shared'

type DraftEmail = Pick<SequenceEmail, 'subject' | 'body' | 'delayDays' | 'imageUrl'>

export default function EmailEditor({
  email,
  idx,
  seqName,
  prevEmails,
  onSave,
  onBack,
}: {
  email: SequenceEmail | null
  idx: number
  seqName: string
  prevEmails: SequenceEmail[]
  onSave: (draft: DraftEmail) => void
  onBack: () => void
}) {
  const [subject, setSubject] = useState(email?.subject ?? '')
  const [body, setBody] = useState(email?.body ?? '')
  const [delayDays, setDelayDays] = useState(email?.delayDays ?? (idx === 0 ? 0 : 3))
  const [imageUrl, setImageUrl] = useState(email?.imageUrl ?? '')

  const [aiOpen, setAiOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErr, setAiErr] = useState('')

  const [imgUploading, setImgUploading] = useState(false)
  const [imgErr, setImgErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function generate() {
    if (!aiTopic.trim()) return
    setAiLoading(true)
    setAiErr('')
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          index: idx,
          seqName,
          prevSubjects: prevEmails.map((e) => e.subject),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiErr(data.error || 'Generovanie zlyhalo. Skontroluj pripojenie.')
      } else {
        setSubject(data.subject || '')
        setBody(data.body || '')
        setAiOpen(false)
        setAiTopic('')
      }
    } catch {
      setAiErr('Generovanie zlyhalo. Skontroluj pripojenie.')
    }
    setAiLoading(false)
  }

  async function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgErr('')
    setImgUploading(true)
    try {
      // Rovnaký mechanizmus ako components/admin/FileUploadForm.tsx —
      // priamy upload z prehliadača do Vercel Blobu cez token z /api/admin/upload.
      // Na rozdiel od FileUploadForm (private, členský obsah) tu volíme 'public',
      // lebo obrázok musí byť načítateľný priamo v emailovom kliente príjemcu.
      // Očisti názov: odstráň diakritiku, medzery a špeciálne znaky,
      // ktoré vedia rozbiť Blob pathname/URL.
      const safeName = file.name
        .normalize('NFD')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
      const blob = await upload(`newsletter/${Date.now()}-${safeName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
      })
      setImageUrl(blob.url)
    } catch (err) {
      setImgErr((err as Error).message || 'Nahrávanie zlyhalo.')
    } finally {
      setImgUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 560, margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: COLORS.textSecondary, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 18 }}
      >
        ← Späť na emaily
      </button>

      <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: '26px 22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: BTC,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {idx + 1}
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: COLORS.textPrimary }}>Email č. {idx + 1}</h2>
        </div>

        {idx === 0 ? (
          <div style={{ background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, borderRadius: 8, padding: '9px 13px', marginBottom: 16, fontSize: 12, color: COLORS.textSecondary }}>
            Prvý email odíde hneď po triggeri.
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Oneskorenie (dni po predošlom emaily)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value, 10) || 1)}
              style={{ ...inputStyle, width: 72 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Predmet emailu</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="napr. Vitaj. Toto je prvý krok."
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>Obrázok (nepovinné)</label>
          </div>
          {imageUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, border: `0.5px solid ${COLORS.border}`, display: 'block' }}
              />
              <button
                onClick={() => setImageUrl('')}
                aria-label="Odstrániť obrázok"
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: 'none',
                  background: COLORS.textDanger,
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onImagePick} disabled={imgUploading} style={{ fontSize: 12 }} />
              {imgUploading && <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.textMuted }}>Nahrávam…</p>}
              {imgErr && <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.textDanger }}>{imgErr}</p>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: aiOpen ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>Text emailu</label>
            <Btn
              variant="ai"
              small
              onClick={() => {
                setAiOpen(!aiOpen)
                setAiErr('')
              }}
            >
              {aiOpen ? '× Zatvoriť AI' : '✨ AI asistent'}
            </Btn>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Napíš text emailu…"
            rows={7}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {aiOpen && (
          <div style={{ background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>Popíš tému emailu</p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: COLORS.textSecondary }}>
              Konkrétna inšpirácia, príbeh, téma. AI napíše v tvojom tóne — bez hype, bez vágnych viet.
            </p>
            <textarea
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="napr. 'inflácia zjedla rodičom úspory — prečo to bolí a čo s tým urobiť'"
              rows={3}
              style={{ ...inputStyle, marginBottom: 10, fontSize: 13, resize: 'vertical' }}
            />
            {aiErr && <p style={{ margin: '0 0 8px', fontSize: 12, color: COLORS.textDanger }}>{aiErr}</p>}
            <Btn onClick={generate} disabled={!aiTopic.trim() || aiLoading}>
              {aiLoading ? 'Generujem…' : '→ Vygeneruj'}
            </Btn>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn variant="ghost" onClick={onBack}>
          Zrušiť
        </Btn>
        <Btn onClick={() => onSave({ subject, body, delayDays, imageUrl: imageUrl || undefined })}>Uložiť email</Btn>
      </div>
    </div>
  )
}
