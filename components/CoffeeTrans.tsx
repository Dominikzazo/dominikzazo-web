'use client'
import { useState, useEffect } from 'react'

export default function CoffeeTrans({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(5)

  useEffect(() => {
    if (count <= 0) { onDone(); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center page-enter"
      style={{ background: '#fafaf8' }}
    >
      <svg width="72" height="88" viewBox="0 0 72 88" style={{ marginBottom: 32 }}>
        {[22, 36, 50].map((x, i) => (
          <path
            key={x}
            d={`M${x},28 Q${x - 4},18 ${x},8 Q${x + 4},-2 ${x},-8`}
            stroke="#c9a96e"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="animate-steam"
            style={{ animationDelay: `${i * 0.6}s`, transformOrigin: `${x}px 18px` }}
          />
        ))}
        <path d="M10,32 L14,80 Q36,90 58,80 L62,32 Z" fill="#1a1a1a" />
        <path d="M62,46 Q80,46 80,62 Q80,78 62,73" stroke="#1a1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M13,44 Q36,52 59,44" stroke="#c9a96e" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>

      <div
        key={count}
        className="animate-count-pop"
        style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 42, color: '#1a1a1a', fontWeight: 700, marginBottom: 10 }}
      >
        {count}
      </div>

      <div style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 19, color: '#888', marginBottom: 32 }}>
        Tento čas je pre teba..
      </div>

      <button
        onClick={onDone}
        style={{ border: '1.5px solid #e0dcd6', borderRadius: 99, padding: '8px 24px', fontSize: 13, fontFamily: 'var(--font-inter), sans-serif', background: 'transparent', color: '#bbb', cursor: 'pointer' }}
      >
        preskočiť →
      </button>
    </div>
  )
}
