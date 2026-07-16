'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Sequence, Enrollment, EnrollmentStatus, NewsletterData } from '@/lib/newsletter/types'
import { engagementFor } from '@/lib/newsletter/engagement'
import { COLORS, BTC } from './shared'

type Data = NewsletterData

// Engagement sa vzťahuje na posledný ODOSLANÝ mail sekvencie
// (nextEmailIndex ukazuje na ďalší v poradí). Nič odoslané → null.
function engagementOf(data: Data | null, e: Enrollment) {
  if (!data) return null
  const lastIdx = e.nextEmailIndex - 1
  if (lastIdx < 0) return null
  return engagementFor(data, e.email, `${e.sequenceId}:${lastIdx}`)
}

// „o N dní" pre ďalší mail — len pre aktívne enrollmenty, inak „—".
function relativeNext(nextSendAt: string, status: EnrollmentStatus): string {
  if (status !== 'active') return '—'
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const due = new Date(nextSendAt)
  due.setUTCHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - now.getTime()) / 86400000)
  if (days <= 0) return 'dnes'
  if (days === 1) return 'zajtra'
  return `o ${days} dní`
}

const STATUS_META: Record<EnrollmentStatus, { label: string; bg: string; fg: string }> = {
  active: { label: 'aktívny', bg: COLORS.bgAccent, fg: COLORS.textAccent },
  done: { label: 'dokončený', bg: COLORS.bgSuccess, fg: COLORS.textSuccess },
  unsubscribed: { label: 'odhlásený', bg: COLORS.surface0, fg: COLORS.textMuted },
  bounced: { label: 'bounce', bg: COLORS.bgDanger, fg: COLORS.textDanger },
}

function Chip({ label, value, bg, fg }: { label?: string; value: string; bg?: string; fg?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 12,
        background: bg || COLORS.surface0,
        color: fg || COLORS.textSecondary,
        whiteSpace: 'nowrap',
      }}
    >
      {label && <span style={{ color: COLORS.textMuted }}>{label}</span>}
      {value}
    </span>
  )
}

function Row({
  e,
  seq,
  engagement,
}: {
  e: Enrollment
  seq?: Sequence
  engagement: { opened: boolean; clicked: boolean } | null
}) {
  const total = seq?.emails.length ?? 0
  const received = Math.min(e.nextEmailIndex, total)
  const status = STATUS_META[e.status]
  return (
    <div
      style={{
        background: COLORS.surface2,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={e.email}
        >
          {e.email}
        </span>
        <span
          style={{
            flexShrink: 0,
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            background: status.bg,
            color: status.fg,
          }}
        >
          {status.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip value={seq?.name || 'neznáma sekvencia'} />
        <Chip label="postup" value={`${received}/${total}`} />
        <Chip label="ďalší" value={relativeNext(e.nextSendAt, e.status)} />
        {engagement && (
          <>
            <Chip
              label="otvoril"
              value={engagement.opened ? '✓' : '—'}
              bg={engagement.opened ? COLORS.bgSuccess : undefined}
              fg={engagement.opened ? COLORS.textSuccess : undefined}
            />
            <Chip
              label="klikol"
              value={engagement.clicked ? '✓' : '—'}
              bg={engagement.clicked ? COLORS.bgSuccess : undefined}
              fg={engagement.clicked ? COLORS.textSuccess : undefined}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function Odberatelia({ initialData }: { initialData?: Data }) {
  const [data, setData] = useState<Data | null>(initialData ?? null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (initialData) return
    fetch('/api/admin/newsletter')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) =>
        setData({
          sequences: d.sequences || [],
          enrollments: d.enrollments || [],
          events: d.events || [],
        }),
      )
      .catch(() => setErr(true))
  }, [initialData])

  const rows = useMemo(() => {
    if (!data) return []
    return [...data.enrollments].sort(
      (a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime(),
    )
  }, [data])

  const counts = useMemo(() => {
    const c = { active: 0, done: 0, unsubscribed: 0, bounced: 0 }
    for (const e of rows) c[e.status]++
    return c
  }, [rows])

  const seqById = useMemo(() => {
    const m = new Map<string, Sequence>()
    for (const s of data?.sequences || []) m.set(s.id, s)
    return m
  }, [data])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
      <a href="/admin/newsletter" style={{ fontSize: 13, color: COLORS.textMuted, textDecoration: 'none' }}>
        ← naspäť na newsletter
      </a>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: COLORS.textPrimary, margin: '14px 0 4px' }}>
        Odberatelia
      </h1>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: '0 0 22px' }}>
        Kto je v drip sekvencii, kde sa nachádza a kedy mu ide ďalší mail.
      </p>

      {err && (
        <p style={{ fontSize: 13, color: COLORS.textDanger }}>Nepodarilo sa načítať dáta.</p>
      )}

      {data && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          <Chip label="aktívni" value={String(counts.active)} bg={COLORS.bgAccent} fg={COLORS.textAccent} />
          <Chip label="dokončení" value={String(counts.done)} bg={COLORS.bgSuccess} fg={COLORS.textSuccess} />
          {counts.unsubscribed > 0 && <Chip label="odhlásení" value={String(counts.unsubscribed)} />}
          {counts.bounced > 0 && <Chip label="bounce" value={String(counts.bounced)} bg={COLORS.bgDanger} fg={COLORS.textDanger} />}
        </div>
      )}

      {data && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
          <p style={{ fontWeight: 500, margin: '0 0 6px', color: COLORS.textPrimary }}>Zatiaľ žiadni odberatelia</p>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0 }}>
            Prví prihlásení sa objavia tu po potvrdení prihlásenia.
          </p>
        </div>
      )}

      {!data && !err && (
        <p style={{ fontSize: 13, color: COLORS.textMuted }}>Načítavam…</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((e, i) => (
          <Row
            key={`${e.email}-${e.sequenceId}-${i}`}
            e={e}
            seq={seqById.get(e.sequenceId)}
            engagement={engagementOf(data, e)}
          />
        ))}
      </div>

      <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 24, lineHeight: 1.6 }}>
        „Otvoril/klikol" sa vzťahuje na <strong>posledný odoslaný</strong> mail sekvencie. Email vie
        merať len otvorenie (pixel) a klik — nie scroll ani to, kam sa človek dočítal. Otvorenie je
        nepresné (Gmail občas pixel prednačíta, blokované obrázky ho zas nezachytia);{' '}
        <strong>klik je spoľahlivejší signál</strong>. Farba <span style={{ color: BTC }}>oranžová</span> = drip beží.
      </p>
    </div>
  )
}
