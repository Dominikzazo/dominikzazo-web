'use client'
import { useEffect, useMemo, useState } from 'react'
import { COLORS } from './shared'
import { formatResendDate } from '@/lib/newsletter/dates'

type SentEmail = { id: string; subject: string; to: string; createdAt: string; lastEvent: string }
type SentBroadcast = { id: string; name: string; sentAt: string | null }
type Data = { emails: SentEmail[]; broadcasts: SentBroadcast[] }

// Resend „last_event" → čitateľný štítok + farba.
const EVENT_META: Record<string, { label: string; bg: string; fg: string }> = {
  sent: { label: 'odoslaný', bg: COLORS.surface0, fg: COLORS.textSecondary },
  delivered: { label: 'doručený', bg: COLORS.bgSuccess, fg: COLORS.textSuccess },
  opened: { label: 'otvorený', bg: COLORS.bgAccent, fg: COLORS.textAccent },
  clicked: { label: 'klik', bg: COLORS.bgAccent, fg: COLORS.textAccent },
  bounced: { label: 'bounce', bg: COLORS.bgDanger, fg: COLORS.textDanger },
  complained: { label: 'spam', bg: COLORS.bgDanger, fg: COLORS.textDanger },
  delivery_delayed: { label: 'zdržaný', bg: COLORS.surface0, fg: COLORS.textMuted },
}

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: bg, color: fg }}>
      {label}
    </span>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  )
}

export default function Historia({ initialData }: { initialData?: Data }) {
  const [data, setData] = useState<Data | null>(initialData ?? null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (initialData) return
    fetch('/api/admin/newsletter/history')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) => setData({ emails: d.emails || [], broadcasts: d.broadcasts || [] }))
      .catch(() => setErr('Nepodarilo sa načítať históriu.'))
  }, [initialData])

  const emails = useMemo(
    () => [...(data?.emails ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  )
  const broadcasts = useMemo(
    () => [...(data?.broadcasts ?? [])].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')),
    [data],
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
      <a href="/admin/newsletter" style={{ fontSize: 13, color: COLORS.textMuted, textDecoration: 'none' }}>
        ← naspäť na newsletter
      </a>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: COLORS.textPrimary, margin: '14px 0 4px' }}>História</h1>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: '0 0 26px' }}>
        Všetko, čo si odoslal — týždenné čísla aj jednotlivé maily zo sekvencií.
      </p>

      {err && <p style={{ fontSize: 13, color: COLORS.textDanger }}>{err}</p>}
      {!data && !err && <p style={{ fontSize: 13, color: COLORS.textMuted }}>Načítavam…</p>}

      {data && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 4px' }}>
            🕊️ Nedeľné ticho
          </h2>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 12px' }}>
            Týždenné čísla rozoslané celému zoznamu.
          </p>
          {broadcasts.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '0 0 30px' }}>Zatiaľ žiadne odoslané číslo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {broadcasts.map((b) => (
                <Card key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>{b.name}</span>
                    <Badge label="odoslané" bg={COLORS.bgSuccess} fg={COLORS.textSuccess} />
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{formatResendDate(b.sentAt)}</span>
                </Card>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 4px' }}>
            ✉ Odoslané maily
          </h2>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 12px' }}>
            Každý jeden mail — drip, potvrdzovacie aj týždenné. Stav je posledná udalosť z Resendu.
          </p>
          {emails.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.textMuted }}>Zatiaľ nič odoslané.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((e) => {
                const meta = EVENT_META[e.lastEvent] || { label: e.lastEvent, bg: COLORS.surface0, fg: COLORS.textMuted }
                return (
                  <Card key={e.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.subject}
                      </span>
                      <Badge label={meta.label} bg={meta.bg} fg={meta.fg} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, color: COLORS.textMuted }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.to}</span>
                      <span style={{ flexShrink: 0 }}>{formatResendDate(e.createdAt)}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
