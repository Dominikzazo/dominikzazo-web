'use client'
import { useReducer } from 'react'
import Link from 'next/link'

/* ── date helpers ── */
const todayKey = () => new Date().toISOString().slice(0, 10)
const SK_DAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota']
const SK_MONTHS = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra']
const formatDate = (d: Date) => `${SK_DAYS[d.getDay()]}, ${d.getDate()}. ${SK_MONTHS[d.getMonth()]} ${d.getFullYear()}`

/* ── data ── */
interface CheckItem { id: string; text: string; hasInput?: boolean; placeholder?: string }
interface Section { id: string; label: string; subtitle: string; emoji: string; color: string; lightBg: string; items: CheckItem[] }

const SECTIONS: Section[] = [
  {
    id: 'vecer', label: 'večer.', subtitle: 'deň dozadu.', emoji: '🌙', color: '#4a72a8', lightBg: '#eef3fa',
    items: [
      { id: 'plan',     text: 'Naplánuj zajtrajší deň' },
      { id: 'main',     text: 'Jedna hlavná úloha, ktorej má deň patriť', hasInput: true, placeholder: 'čo je tá jedna vec...' },
      { id: 'tasks',    text: 'Menšie úlohy sú zadané' },
      { id: 'internet', text: 'Vypni internet, wi-fi aj dáta 📵' },
    ],
  },
  {
    id: 'rano', label: 'ráno.', subtitle: 'začni dobre.', emoji: '🌅', color: '#8a5a3a', lightBg: '#faf4ee',
    items: [
      { id: 'gratitude', text: 'Posaď sa a poďakuj za možnosť žiť dnešný deň 🙏' },
      { id: 'teeth',     text: 'Umy si zuby 🦷, to sa celkom hodí' },
      { id: 'breakfast', text: 'Pomalé raňajky, bez telefónu' },
      { id: 'coffee',    text: 'Čaj alebo kávička ☕, so srdcom' },
      { id: 'remember',  text: 'Pamätaj na tvoj hlavný task dňa 🎯' },
    ],
  },
  {
    id: 'den', label: 'počas dňa.', subtitle: 'aspoň dvakrát.', emoji: '☀️', color: '#5a8a3a', lightBg: '#eef6ea',
    items: [
      { id: 'slow1', text: '5 minút ticha, prvýkrát ○' },
      { id: 'slow2', text: '5 minút ticha, druhýkrát, prechádzka bez slúchadiel, kávička, výhľad z okna... ○○' },
    ],
  },
]

const TOTAL = SECTIONS.reduce((s, sec) => s + sec.items.length, 0)

/* ── state ── */
interface State { checks: Record<string, boolean>; inputs: Record<string, string> }
type Action = { type: 'TOGGLE'; id: string } | { type: 'INPUT'; id: string; value: string } | { type: 'RESET' }

const load = (): State => {
  if (typeof window === 'undefined') return { checks: {}, inputs: {} }
  try {
    const raw = localStorage.getItem('slow_life_' + todayKey())
    return raw ? JSON.parse(raw) : { checks: {}, inputs: {} }
  } catch { return { checks: {}, inputs: {} } }
}

const reducer = (state: State, action: Action): State => {
  let next = state
  if (action.type === 'TOGGLE') {
    next = { ...state, checks: { ...state.checks, [action.id]: !state.checks[action.id] } }
  } else if (action.type === 'INPUT') {
    next = { ...state, inputs: { ...state.inputs, [action.id]: action.value } }
  } else if (action.type === 'RESET') {
    next = { checks: {}, inputs: { ...state.inputs } }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('slow_life_' + todayKey(), JSON.stringify(next))
  }
  return next
}

/* ── progress ring ── */
function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = 20, circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="#f0ede6" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}

/* ── section card ── */
function SectionCard({ section, state, dispatch, delay }: { section: Section; state: State; dispatch: React.Dispatch<Action>; delay: number }) {
  const total = section.items.length
  const done = section.items.filter(i => state.checks[i.id]).length
  const pct = total ? done / total : 0
  const allDone = done === total

  return (
    <div className="section-card animate-fade-in" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)', padding: '32px 36px', animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 13, color: '#bbb', fontFamily: 'var(--font-inter), sans-serif', letterSpacing: '0.04em', marginBottom: 2 }}>{section.subtitle}</div>
          <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 32, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{section.emoji}</span>
            {section.label}
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <ProgressRing pct={pct} color={section.color} />
          <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'var(--font-inter), sans-serif' }}>{done}/{total}</span>
        </div>
      </div>

      <div className="progress-bar-track" style={{ marginBottom: 24 }}>
        <div className="progress-bar-fill" style={{ width: `${pct * 100}%`, background: section.color }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {section.items.map(item => {
          const checked = !!state.checks[item.id]
          return (
            <div key={item.id}>
              <div
                role="checkbox"
                aria-checked={checked}
                onClick={() => dispatch({ type: 'TOGGLE', id: item.id })}
                className="check-row"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0', cursor: 'pointer', userSelect: 'none', borderRadius: 10, transition: 'background 0.15s' }}
              >
                <div style={{ width: 28, height: 28, flexShrink: 0, marginTop: 2, borderRadius: 8, borderWidth: 2, borderStyle: 'solid', borderColor: checked ? section.color : '#ddd', background: checked ? section.color : 'transparent', position: 'relative', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {checked && (
                    <svg viewBox="0 0 22 22" width="16" height="16">
                      <path d="M4,12 L9,17 L18,6"
                        stroke="white" strokeWidth="2.5" fill="none"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{ strokeDasharray: 30, animation: 'checkDraw 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
                      />
                    </svg>
                  )}
                </div>
                <span
                  style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 20, lineHeight: 1.45, transition: 'color 0.3s', position: 'relative', color: checked ? '#bbb' : '#1a1a1a' }}
                  className={checked ? 'check-text-done' : ''}
                >
                  {item.text}
                </span>
              </div>
              {item.hasInput && (
                <div style={{ paddingLeft: 42, paddingBottom: 6 }}>
                  <input
                    type="text"
                    placeholder={item.placeholder}
                    value={state.inputs[item.id] ?? ''}
                    onClick={e => e.stopPropagation()}
                    onChange={e => dispatch({ type: 'INPUT', id: item.id, value: e.target.value })}
                    style={{ width: '100%', background: '#fafaf8', border: '1.5px solid #e8e4dc', borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-caveat), cursive', fontSize: 19, color: '#1a1a1a', outline: 'none', transition: 'border-color 0.2s', marginTop: 4 }}
                    onFocus={e => { e.target.style.borderColor = '#a0c89a' }}
                    onBlur={e => { e.target.style.borderColor = '#e8e4dc' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="animate-fade-in" style={{ marginTop: 20, padding: '12px 18px', background: section.lightBg, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, color: section.color }}>
            {section.id === 'vecer' ? 'Zajtrajšok má základ. Dobre spávaj.'
             : section.id === 'rano' ? 'Ráno zvládnuté. Dnes to bude dobré.'
             : 'Ticho nájdené. Deň žitý dobre.'}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── app ── */
export default function SlowLife() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const totalDone = Object.values(state.checks).filter(Boolean).length
  const allDone = totalDone === TOTAL
  const now = new Date()

  return (
    <div style={{ background: '#fdf9f0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 80px' }}>

        <Link href="/" className="back-link" style={{ marginBottom: 40, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 13, fontFamily: 'var(--font-inter), sans-serif', textDecoration: 'none' }}>
          ← späť na web
        </Link>

        <div style={{ marginBottom: 48, marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#bbb', fontFamily: 'var(--font-inter), sans-serif', letterSpacing: '0.04em', marginBottom: 8 }}>
            {formatDate(now)}
          </div>
          <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 48, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1a1a1a', marginBottom: 16 }}>
            pomalé ráno.
          </h1>
          <p style={{ fontSize: 15, color: '#aaa', lineHeight: 1.7, fontFamily: 'var(--font-inter), sans-serif', maxWidth: 440 }}>
            Ráno začína deň dozadu. Priprav sa večer, žij pomaly ráno, nájdi si ticho cez deň.
          </p>

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${(totalDone / TOTAL) * 100}%`, background: 'linear-gradient(90deg, #4a72a8, #5a8a3a)' }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 17, color: '#aaa', flexShrink: 0 }}>
              {totalDone} / {TOTAL}
            </span>
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              style={{ border: '1.5px solid #ece8e0', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontFamily: 'var(--font-inter), sans-serif', background: 'transparent', color: '#bbb', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#888' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#ece8e0'; e.currentTarget.style.color = '#bbb' }}
            >
              resetuj
            </button>
          </div>
        </div>

        {allDone && (
          <div className="animate-celebrate" style={{ marginBottom: 32, padding: '24px 28px', background: 'linear-gradient(135deg, #f0f6ec, #ecf4f8)', borderRadius: 20, textAlign: 'center' }}>
            <div className="animate-float-slow" style={{ fontSize: 36, marginBottom: 10 }}>🌿</div>
            <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 26, color: '#5a7a56', marginBottom: 6 }}>Dnešok je tvoj.</div>
            <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 13, color: '#aaa' }}>Všetko zaškrtnuté. Pomaly, vedome, s úmyslom.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS.map((sec, i) => (
            <SectionCard key={sec.id} section={sec} state={state} dispatch={dispatch} delay={i * 80} />
          ))}
        </div>

        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 16, color: '#ccc', lineHeight: 1.7 }}>
            „Nauč sa byť ticho, aspoň chvíľku."
          </p>
          <p style={{ fontSize: 12, color: '#ddd', fontFamily: 'var(--font-inter), sans-serif', marginTop: 8 }}>
            — Dominik Žažo
          </p>
        </div>
      </div>
    </div>
  )
}
