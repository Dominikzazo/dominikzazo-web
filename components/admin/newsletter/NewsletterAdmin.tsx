'use client'
import { useEffect, useState } from 'react'
import type { Sequence, SequenceEmail, SequenceTrigger } from '@/lib/newsletter/types'
import EmailEditor from './EmailEditor'
import { Btn, BTC, BTC_LIGHT, BTC_BORDER, COLORS, TRIGGER_LABELS, TRIGGER_OPTIONS, inputStyle, labelStyle } from './shared'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

// ---------- drobné kúsky UI ----------

function StepDot({ n, current }: { n: number; current: number }) {
  const done = current > n
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 500,
        flexShrink: 0,
        background: current === n ? BTC : done ? COLORS.bgSuccess : COLORS.surface0,
        color: current === n ? '#fff' : done ? COLORS.textSuccess : COLORS.textMuted,
        border: current === n ? 'none' : `0.5px solid ${COLORS.border}`,
      }}
    >
      {done ? '✓' : n}
    </div>
  )
}

const STEP_LABELS: [string, number][] = [
  ['Základ', 1],
  ['Emaily', 2],
  ['Prehľad', 3],
]

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {STEP_LABELS.map(([label, n], i) => (
        <div key={n} style={{ display: 'contents' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StepDot n={n} current={step} />
            <span style={{ fontSize: 12, fontWeight: step === n ? 500 : 400, color: step === n ? COLORS.textPrimary : COLORS.textMuted, whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && <div style={{ flex: 1, height: '0.5px', background: COLORS.border, margin: '0 8px', minWidth: 12 }} />}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✉</div>
      <p style={{ fontWeight: 500, margin: '0 0 6px', color: COLORS.textPrimary }}>Žiadne sekvencie</p>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: '0 0 22px' }}>
        Vytvor svoju prvú email sériu krok za krokom s pomocou AI.
      </p>
      <Btn onClick={onCreate}>+ Vytvor prvú sekvenciu</Btn>
    </div>
  )
}

function SeqCard({ seq, onEdit, onDelete }: { seq: Sequence; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: seq.emails?.length ? 10 : 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: COLORS.textPrimary }}>{seq.name}</p>
            {!seq.active && (
              <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.textMuted, border: `0.5px solid ${COLORS.border}`, borderRadius: 5, padding: '1px 6px' }}>
                neaktívna
              </span>
            )}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: COLORS.textSecondary }}>
            {seq.emails?.length || 0} emailov · {TRIGGER_LABELS[seq.trigger]}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="ghost" small onClick={onEdit}>
            Upraviť
          </Btn>
          <Btn variant="danger" small onClick={onDelete}>
            Zmazať
          </Btn>
        </div>
      </div>
      {seq.emails?.length > 0 && (
        <div style={{ borderTop: `0.5px solid ${COLORS.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {seq.emails.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', gap: 8, fontSize: 12, color: COLORS.textSecondary, alignItems: 'center' }}>
              <span style={{ color: BTC, fontWeight: 500, minWidth: 22 }}>#{i + 1}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject || '(bez predmetu)'}</span>
              <span style={{ flexShrink: 0 }}>{i === 0 ? 'hneď' : `+${e.delayDays}d`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- wizard kroky ----------

function Step1({
  name,
  setName,
  trigger,
  setTrigger,
  active,
  setActive,
}: {
  name: string
  setName: (v: string) => void
  trigger: SequenceTrigger
  setTrigger: (v: SequenceTrigger) => void
  active: boolean
  setActive: (v: boolean) => void
}) {
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 500, color: COLORS.textPrimary }}>Základné info</h2>
      <p style={{ margin: '0 0 22px', fontSize: 13, color: COLORS.textSecondary }}>Pomenuj sekvenciu a nastav kedy sa automaticky spustí.</p>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Názov sekvencie</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="napr. Welcome séria, Bitcoin 101…" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Kedy sa spustí?</label>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value as SequenceTrigger)} style={inputStyle}>
          {TRIGGER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TRIGGER_LABELS[t]}
            </option>
          ))}
        </select>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.textMuted }}>
          Automaticky sa reálne spúšťajú len aktívne sekvencie s triggerom „po prihlásení na newsletter".
        </p>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.textPrimary, cursor: 'pointer' }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: 'auto', display: 'inline-block' }} />
        Sekvencia je aktívna
      </label>
    </div>
  )
}

function Step2({
  emails,
  setEmails,
  onEdit,
}: {
  emails: SequenceEmail[]
  setEmails: (v: SequenceEmail[]) => void
  onEdit: (id: string | 'new') => void
}) {
  const move = (i: number, dir: number) => {
    const a = [...emails]
    const t = i + dir
    if (t < 0 || t >= a.length) return
    ;[a[i], a[t]] = [a[t], a[i]]
    setEmails(a)
  }
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 500, color: COLORS.textPrimary }}>Emaily</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: COLORS.textSecondary }}>
        Pridaj emaily jeden po druhom. Každý má predmet, text a oneskorenie.
      </p>
      {emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px', border: `1px dashed ${COLORS.borderStrong}`, borderRadius: 10 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: COLORS.textMuted }}>Ešte žiadne emaily</p>
          <Btn onClick={() => onEdit('new')}>+ Pridaj prvý email</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {emails.map((e, i) => (
            <div
              key={e.id}
              style={{
                background: COLORS.surface1,
                border: `0.5px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: BTC,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.textPrimary }}>
                  {e.subject || '(bez predmetu)'}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: COLORS.textMuted }}>{i === 0 ? 'odíde hneď' : `+${e.delayDays} dní`}</p>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  style={{
                    fontSize: 11,
                    padding: '3px 6px',
                    borderRadius: 5,
                    border: `0.5px solid ${COLORS.border}`,
                    background: 'none',
                    cursor: i === 0 ? 'default' : 'pointer',
                    opacity: i === 0 ? 0.35 : 1,
                    color: COLORS.textSecondary,
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === emails.length - 1}
                  style={{
                    fontSize: 11,
                    padding: '3px 6px',
                    borderRadius: 5,
                    border: `0.5px solid ${COLORS.border}`,
                    background: 'none',
                    cursor: i === emails.length - 1 ? 'default' : 'pointer',
                    opacity: i === emails.length - 1 ? 0.35 : 1,
                    color: COLORS.textSecondary,
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => onEdit(e.id)}
                  style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', background: COLORS.bgAccent, color: COLORS.textAccent, cursor: 'pointer' }}
                >
                  Upraviť
                </button>
                <button
                  onClick={() => setEmails(emails.filter((x) => x.id !== e.id))}
                  style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', background: COLORS.bgDanger, color: COLORS.textDanger, cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => onEdit('new')}
            style={{ width: '100%', padding: '9px', border: `1px dashed ${COLORS.borderStrong}`, borderRadius: 10, background: 'none', fontSize: 12, color: COLORS.textMuted, cursor: 'pointer' }}
          >
            + Pridaj ďalší email
          </button>
        </div>
      )}
    </div>
  )
}

function Step3({ name, trigger, active, emails }: { name: string; trigger: SequenceTrigger; active: boolean; emails: SequenceEmail[] }) {
  const rows: [string, string][] = [
    ['Názov', name],
    ['Trigger', TRIGGER_LABELS[trigger]],
    ['Emailov', `${emails.length}`],
    ['Stav', active ? 'aktívna' : 'neaktívna'],
  ]
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 500, color: COLORS.textPrimary }}>Prehľad</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: COLORS.textSecondary }}>Skontroluj pred uložením.</p>
      <div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `0.5px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: k === 'Stav' && active ? COLORS.textSuccess : COLORS.textPrimary }}>{v}</span>
          </div>
        ))}
      </div>
      {emails.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>Poradie emailov:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {emails.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center' }}>
                <span style={{ color: BTC, fontWeight: 500 }}>#{i + 1}</span>
                <span style={{ flex: 1, color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject || '(bez predmetu)'}</span>
                <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>{i === 0 ? 'hneď' : `+${e.delayDays}d`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- wizard ----------

function Wizard({
  initial,
  onSave,
  onBack,
}: {
  initial: Sequence | null
  onSave: (seq: Sequence) => void
  onBack: () => void
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initial?.name ?? '')
  const [trigger, setTrigger] = useState<SequenceTrigger>(initial?.trigger ?? 'signup')
  const [active, setActive] = useState(initial?.active ?? true)
  const [emails, setEmails] = useState<SequenceEmail[]>(initial?.emails ?? [])
  const [emailEdit, setEmailEdit] = useState<string | 'new' | null>(null)

  if (emailEdit !== null) {
    const existing = emailEdit === 'new' ? null : emails.find((e) => e.id === emailEdit) ?? null
    const idx = emailEdit === 'new' ? emails.length : emails.findIndex((e) => e.id === emailEdit)
    return (
      <EmailEditor
        email={existing}
        idx={idx}
        seqName={name}
        prevEmails={emails.filter((e) => e.id !== emailEdit)}
        onSave={(draft) => {
          if (emailEdit === 'new') {
            setEmails([...emails, { ...draft, id: newId() }])
          } else {
            setEmails(emails.map((e) => (e.id === emailEdit ? { ...e, ...draft } : e)))
          }
          setEmailEdit(null)
        }}
        onBack={() => setEmailEdit(null)}
      />
    )
  }

  const canNext = step === 1 ? name.trim().length > 0 : true

  return (
    <div style={{ padding: '20px 16px', maxWidth: 560, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: COLORS.textSecondary, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 18 }}>
        ← Späť
      </button>
      <Stepper step={step} />
      <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: '26px 22px', marginBottom: 18 }}>
        {step === 1 && <Step1 name={name} setName={setName} trigger={trigger} setTrigger={setTrigger} active={active} setActive={setActive} />}
        {step === 2 && <Step2 emails={emails} setEmails={setEmails} onEdit={setEmailEdit} />}
        {step === 3 && <Step3 name={name} trigger={trigger} active={active} emails={emails} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : onBack())}>
          {step > 1 ? '← Späť' : 'Zrušiť'}
        </Btn>
        {step < 3 ? (
          <Btn onClick={() => setStep(step + 1)} disabled={!canNext}>
            Ďalej →
          </Btn>
        ) : (
          <Btn onClick={() => onSave({ id: initial?.id ?? newId(), name, trigger, active, emails })}>Uložiť sekvenciu</Btn>
        )}
      </div>
    </div>
  )
}

// ---------- root ----------

export default function NewsletterAdmin() {
  const [sequences, setSequences] = useState<Sequence[] | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [screen, setScreen] = useState<'list' | 'wizard'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/newsletter')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d.sequences)) setSequences(d.sequences)
        else {
          setSequences([])
          setLoadErr('Neočakávaná odpoveď servera.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSequences([])
          setLoadErr('Nepodarilo sa načítať sekvencie.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function persist(updated: Sequence[]) {
    setSequences(updated)
    setSaveState('saving')
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: updated }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaveState('saved')
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch {
      setSaveState('error')
    }
  }

  if (sequences === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Načítavam…</div>
  }

  if (screen === 'wizard') {
    const existing = editId ? sequences.find((s) => s.id === editId) ?? null : null
    return (
      <Wizard
        initial={existing}
        onSave={async (seq) => {
          const updated = existing ? sequences.map((s) => (s.id === existing.id ? seq : s)) : [...sequences, seq]
          await persist(updated)
          setScreen('list')
          setEditId(null)
        }}
        onBack={() => {
          setScreen('list')
          setEditId(null)
        }}
      />
    )
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 620, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: COLORS.textPrimary }}>✉ Email sekvencie</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: COLORS.textSecondary }}>Automatické série emailov pre tvojich odberateľov</p>
        </div>
        <Btn
          onClick={() => {
            setEditId(null)
            setScreen('wizard')
          }}
        >
          + Nová
        </Btn>
      </div>

      <a
        href="/admin/newsletter/tyzdenne"
        style={{
          display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
          background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, borderRadius: 14,
          padding: '16px 18px', marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 24 }}>🕊️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>Napíš týždenné číslo → „Nedeľné ticho"</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>1 myšlienka · 1 krok · 1 otázka — pošli celému zoznamu</div>
        </div>
        <span style={{ color: BTC, fontSize: 18 }}>→</span>
      </a>

      <a
        href="/admin/newsletter/odberatelia"
        style={{
          display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
          background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 14,
          padding: '16px 18px', marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 24 }}>👥</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>Odberatelia</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Kto je v sekvencii, kde sa nachádza a kedy mu ide ďalší mail</div>
        </div>
        <span style={{ color: COLORS.textMuted, fontSize: 18 }}>→</span>
      </a>

      {loadErr && <p style={{ margin: '0 0 14px', fontSize: 12, color: COLORS.textDanger }}>{loadErr}</p>}
      {saveState === 'saving' && <p style={{ margin: '0 0 14px', fontSize: 12, color: COLORS.textMuted }}>Ukladám…</p>}
      {saveState === 'saved' && <p style={{ margin: '0 0 14px', fontSize: 12, color: COLORS.textSuccess }}>✓ Uložené</p>}
      {saveState === 'error' && <p style={{ margin: '0 0 14px', fontSize: 12, color: COLORS.textDanger }}>Uloženie zlyhalo. Skús to znova.</p>}

      {sequences.length === 0 ? (
        <EmptyState onCreate={() => setScreen('wizard')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sequences.map((s) => (
            <SeqCard
              key={s.id}
              seq={s}
              onEdit={() => {
                setEditId(s.id)
                setScreen('wizard')
              }}
              onDelete={() => persist(sequences.filter((x) => x.id !== s.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
