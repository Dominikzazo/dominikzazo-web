'use client'
import { useState } from 'react'

type Heart = { id: number; x: number; delay: number; e: string }
const EMOJIS = ['💗', '💛', '🌿', '✨', '🤍']

export default function BottomSurprise() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [hearts, setHearts] = useState<Heart[]>([])

  const send = () => {
    if (!email.includes('@')) return
    setSent(true)
    setHearts(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: Math.random() * 90 + 5,
        delay: Math.random() * 1.2,
        e: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      }))
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-8 py-[60px]"
      style={{ background: '#fafaf8' }}
    >
      {hearts.map(h => (
        <span
          key={h.id}
          className="absolute bottom-[5%] text-[28px] pointer-events-none animate-heart-float"
          style={{ left: `${h.x}%`, animationDelay: `${h.delay}s` }}
        >
          {h.e}
        </span>
      ))}

      <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, color: '#ccc', marginBottom: 8, letterSpacing: '0.04em' }}>
        psst... 🤫
      </p>

      {!sent ? (
        <>
          <h2
            style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 52, color: '#1a1a1a', marginBottom: 8, textAlign: 'center', lineHeight: 1.1 }}
          >
            Hľadáš viac mňa? 😄
          </h2>
          <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 28, color: '#888', marginBottom: 48, textAlign: 'center' }}>
            No dobre, ostanme v kontakte.
          </p>
          <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, color: '#bbb', marginBottom: 12 }}>
            nikomu ani muk 🤫
          </p>
          <div className="flex gap-2.5 max-w-[440px] w-full flex-wrap justify-center">
            <input
              type="email"
              placeholder="tvoj@email.sk"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              className="flex-1 min-w-[220px] rounded-full outline-none"
              style={{
                background: '#fff',
                border: '1.5px solid #e0e0dc',
                padding: '12px 20px',
                fontSize: 16,
                fontFamily: 'var(--font-caveat), cursive',
                color: '#1a1a1a',
              }}
            />
            <button
              onClick={send}
              className="rounded-full cursor-pointer"
              style={{
                border: 'none',
                padding: '12px 28px',
                fontSize: 16,
                fontFamily: 'var(--font-caveat), cursive',
                background: '#1a1a1a',
                color: '#fff',
              }}
            >
              odoslať 💗
            </button>
          </div>
        </>
      ) : (
        <>
          <h2
            className="animate-count-pop"
            style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 52, color: '#1a1a1a', marginBottom: 12, textAlign: 'center', lineHeight: 1.1 }}
          >
            Ďakujem! 💗
          </h2>
          <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 24, color: '#888', textAlign: 'center' }}>
            Teraz ostaneme v kontakte. Pomaly, ako to tu máme radi. 🌿
          </p>
        </>
      )}
    </div>
  )
}
