'use client'
import { useEffect, useMemo, useState } from 'react'
import { COLORS, BTC, BTC_LIGHT, BTC_BORDER, inputStyle } from './shared'
import { formatResendDate } from '@/lib/newsletter/dates'
import { KIND_LABELS, type EmailKind } from '@/lib/newsletter/history'

type SentEmail = {
  id: string
  subject: string
  to: string
  createdAt: string
  lastEvent: string
  kind: EmailKind
}
type SentBroadcast = { id: string; name: string; sentAt: string | null }
type Data = { emails: SentEmail[]; broadcasts: SentBroadcast[] }

type KindFilter = 'all' | EmailKind
const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'všetko' },
  { value: 'drip', label: KIND_LABELS.drip },
  { value: 'broadcast', label: KIND_LABELS.broadcast },
  { value: 'confirm', label: KIND_LABELS.confirm },
]

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        background: active ? BTC_LIGHT : 'transparent',
        border: `0.5px solid ${active ? BTC_BORDER : COLORS.border}`,
        color: active ? BTC : COLORS.textSecondary,
      }}
    >
      {label}
    </button>
  )
}

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
  const [kind, setKind] = useState<KindFilter>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (initialData) return
    fetch('/api/admin/newsletter/history')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) => setData({ emails: d.emails || [], broadcasts: d.broadcasts || [] }))
      .catch(() => setErr('Nepodarilo sa načítať históriu.'))
  }, [initialData])

  const allEmails = useMemo(
    () => [...(data?.emails ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  )

  const emails = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return allEmails.filter(
      (e) =>
        (kind === 'all' || e.kind === kind) &&
        (!needle || e.to.toLowerCase().includes(needle)),
    )
  }, [allEmails, kind, q])
  const broadcasts = useMemo(
    () => [...(data?.broadcasts ?? [])].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')),
    [data],
  )

  // Týždenné čísla idú celému zoznamu, takže filter podľa adresy sa na ne
  // nevzťahuje — pri hľadaní adresy ich schovávame.
  const showBroadcasts = (kind === 'all' || kind === 'broadcast') && !q.trim()

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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {KIND_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={kind === f.value}
                onClick={() => setKind(f.value)}
              />
            ))}
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hľadaj podľa adresy…"
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 24px' }}>
            {emails.length === allEmails.length
              ? `${allEmails.length} mailov`
              : `${emails.length} z ${allEmails.length} mailov`}
          </p>

          {showBroadcasts && (
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
            </>
          )}

          <h2 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 4px' }}>
            ✉ Odoslané maily
          </h2>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 12px' }}>
            Každý jeden mail — drip, potvrdzovacie aj týždenné. Stav je posledná udalosť z Resendu.
          </p>
          {emails.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.textMuted }}>
              {allEmails.length === 0 ? 'Zatiaľ nič odoslané.' : 'Nič nesedí na tento filter.'}
            </p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.to}
                      </span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: COLORS.textMuted, padding: '2px 7px', borderRadius: 999, background: COLORS.surface0 }}>
                          {KIND_LABELS[e.kind]}
                        </span>
                        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{formatResendDate(e.createdAt)}</span>
                      </span>
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
