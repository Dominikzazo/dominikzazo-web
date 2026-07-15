'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BTC, BTC_LIGHT, BTC_BORDER, COLORS, Btn, inputStyle, labelStyle } from './shared'

interface IssueDraft {
  subject: string
  intro: string
  thought: string
  step: string
  question: string
}

const EMPTY: IssueDraft = { subject: '', intro: '', thought: '', step: '', question: '' }

const ta: React.CSSProperties = { ...inputStyle, minHeight: 68, lineHeight: 1.6, resize: 'vertical' }

export default function WeeklyComposer({ adminEmail }: { adminEmail: string }) {
  const [issue, setIssue] = useState<IssueDraft>(EMPTY)
  const [topic, setTopic] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [busy, setBusy] = useState<'' | 'write' | 'review' | 'test' | 'send'>('')
  const [notes, setNotes] = useState<string[] | null>(null)
  const [improved, setImproved] = useState<Partial<IssueDraft> | null>(null)
  const [testEmail, setTestEmail] = useState(adminEmail)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  const set = (k: keyof IssueDraft, v: string) => setIssue((p) => ({ ...p, [k]: v }))
  const complete = issue.subject.trim() && issue.thought.trim() && issue.step.trim() && issue.question.trim()

  async function aiWrite() {
    if (!topic.trim()) return
    setBusy('write'); setMsg(null)
    try {
      const res = await fetch('/api/admin/newsletter/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'write', topic }),
      })
      const data = await res.json()
      if (data.issue) {
        setIssue({
          subject: data.issue.subject || '', intro: data.issue.intro || '',
          thought: data.issue.thought || '', step: data.issue.step || '', question: data.issue.question || '',
        })
        setAiOpen(false); setTopic('')
      } else setMsg({ kind: 'err', text: data.error || 'Generovanie zlyhalo.' })
    } catch { setMsg({ kind: 'err', text: 'Generovanie zlyhalo.' }) }
    setBusy('')
  }

  async function aiReview() {
    setBusy('review'); setMsg(null); setNotes(null); setImproved(null)
    try {
      const res = await fetch('/api/admin/newsletter/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'review', issue }),
      })
      const data = await res.json()
      if (data.notes) { setNotes(data.notes); setImproved(data.improved || null) }
      else setMsg({ kind: 'err', text: data.error || 'Kontrola zlyhala.' })
    } catch { setMsg({ kind: 'err', text: 'Kontrola zlyhala.' }) }
    setBusy('')
  }

  function applyImproved() {
    if (!improved) return
    setIssue((p) => ({
      ...p,
      intro: improved.intro ?? p.intro, thought: improved.thought ?? p.thought,
      step: improved.step ?? p.step, question: improved.question ?? p.question,
    }))
    setNotes(null); setImproved(null)
    setMsg({ kind: 'ok', text: 'Vylepšená verzia použitá.' })
  }

  async function doSend(action: 'test' | 'send') {
    setBusy(action === 'test' ? 'test' : 'send'); setMsg(null); setConfirmSend(false)
    try {
      const res = await fetch('/api/admin/newsletter/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, issue, testEmail }),
      })
      const data = await res.json()
      if (data.ok) setMsg({ kind: 'ok', text: action === 'test' ? `Test poslaný na ${testEmail}.` : 'Odoslané celému zoznamu. 🤍' })
      else setMsg({ kind: 'err', text: data.error || 'Nepodarilo sa odoslať.' })
    } catch { setMsg({ kind: 'err', text: 'Nepodarilo sa odoslať.' }) }
    setBusy('')
  }

  const Block = ({ n, label, val, k, ph }: { n: string; label: string; val: string; k: keyof IssueDraft; ph: string }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        <span style={{ color: BTC, fontWeight: 600 }}>{n} · {label}</span>
      </label>
      <textarea style={ta} value={val} placeholder={ph} onChange={(e) => set(k, e.target.value)} />
    </div>
  )

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <Link href="/admin/newsletter" style={{ color: COLORS.textSecondary, fontSize: 13, textDecoration: 'none' }}>← Späť na newsletter</Link>

      <div style={{ margin: '18px 0 6px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-lora), serif', color: COLORS.textPrimary }}>Týždenné číslo</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.textSecondary }}>Nedeľné ticho · 1 myšlienka · 1 krok · 1 otázka</p>
      </div>

      <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: '22px 20px', margin: '16px 0 18px' }}>
        {/* AI napíš */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <Btn variant="ai" small onClick={() => setAiOpen(!aiOpen)}>{aiOpen ? '× Zavrieť' : '✨ Napíš mi draft'}</Btn>
        </div>
        {aiOpen && (
          <div style={{ background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: COLORS.textSecondary }}>Téma / inšpirácia — AI napíše 1·1·1 v tvojom tóne.</p>
            <textarea style={{ ...ta, marginBottom: 10 }} value={topic} placeholder="napr. o tom, ako ticho ráno mení celý deň" onChange={(e) => setTopic(e.target.value)} />
            <Btn onClick={aiWrite} disabled={!topic.trim() || busy === 'write'}>{busy === 'write' ? 'Píšem…' : '→ Vygeneruj'}</Btn>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Predmet</label>
          <input style={inputStyle} value={issue.subject} placeholder="napr. Ráno, ktoré ti patrí" onChange={(e) => set('subject', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Úvod <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>(krátky, voliteľný)</span></label>
          <textarea style={ta} value={issue.intro} placeholder="Jedna veta na privítanie…" onChange={(e) => set('intro', e.target.value)} />
        </div>
        <Block n="1" label="myšlienka" val={issue.thought} k="thought" ph="Niečo, čo ti tento týždeň došlo." />
        <Block n="1" label="krok" val={issue.step} k="step" ph="Jedna konkrétna vec na tento týždeň." />
        <Block n="1" label="otázka" val={issue.question} k="question" ph="Jedna otázka do ticha." />

        {/* AI skontroluj */}
        <div style={{ marginTop: 4 }}>
          <Btn variant="ai" small onClick={aiReview} disabled={!complete || busy === 'review'}>{busy === 'review' ? 'Čítam…' : '🔍 Skontroluj mi to'}</Btn>
        </div>
        {notes && (
          <div style={{ background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Návrhy na zlepšenie</p>
            <ul style={{ margin: '0 0 12px', padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.7, color: COLORS.textSecondary }}>
              {notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            {improved && <Btn small onClick={applyImproved}>✓ Použiť vylepšenú verziu</Btn>}
          </div>
        )}
      </div>

      {/* Živý náhľad — plain listový štýl (ako reálny email) */}
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.textMuted }}>Náhľad</p>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '30px 28px', marginBottom: 20 }}>
        <div style={{ paddingBottom: 16, borderBottom: '1px solid #eeeae2' }}>
          <span style={{ fontFamily: 'var(--font-lora), serif', fontSize: 16, color: '#1a1a1a' }}>Dominik Žažo</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#b8b3a8', marginLeft: 8 }}>Nedeľné ticho</span>
        </div>
        <p style={{ margin: '22px 0 20px', fontFamily: 'var(--font-lora), serif', fontSize: 15.5, lineHeight: 1.65, color: '#2b2a27' }}>Ahoj Peter,</p>
        {issue.intro && <p style={{ margin: '0 0 22px', fontFamily: 'var(--font-lora), serif', fontSize: 15.5, lineHeight: 1.65, color: '#2b2a27' }}>{issue.intro}</p>}
        {([['myšlienka', issue.thought], ['krok', issue.step], ['otázka', issue.question]] as const).map(([lbl, val]) => (
          <div key={lbl} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a68a4f', marginBottom: 6 }}>1 · {lbl}</div>
            {(val || '…').split(/\n+/).filter(Boolean).map((line, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontFamily: 'var(--font-lora), serif', fontSize: 15.5, lineHeight: 1.65, color: val ? '#2b2a27' : '#c9c6bf' }}>{line}</p>
            ))}
          </div>
        ))}
        <p style={{ margin: '24px 0 0', fontFamily: 'var(--font-lora), serif', fontSize: 15.5, color: '#2b2a27' }}>Till next Sunday,</p>
        <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 17, color: '#b07d1e' }}>— Dominik</p>
      </div>

      {/* Odoslanie */}
      <div style={{ background: COLORS.surface2, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: '18px 20px' }}>
        <label style={labelStyle}>Testovací email</label>
        <input style={{ ...inputStyle, marginBottom: 12 }} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="ghost" onClick={() => doSend('test')} disabled={!complete || busy === 'test'}>{busy === 'test' ? 'Posielam…' : '✉ Poslať test mne'}</Btn>
          {!confirmSend ? (
            <Btn onClick={() => setConfirmSend(true)} disabled={!complete}>Poslať všetkým →</Btn>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: COLORS.textDanger }}>Naozaj celému zoznamu?</span>
              <Btn onClick={() => doSend('send')} disabled={busy === 'send'}>{busy === 'send' ? 'Posielam…' : 'Áno, poslať'}</Btn>
              <Btn variant="ghost" small onClick={() => setConfirmSend(false)}>Zrušiť</Btn>
            </div>
          )}
        </div>
        {msg && <p style={{ margin: '12px 0 0', fontSize: 13, color: msg.kind === 'ok' ? COLORS.textSuccess : COLORS.textDanger }}>{msg.text}</p>}
      </div>
    </div>
  )
}
