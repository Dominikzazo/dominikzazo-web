'use client'
import { useState, useEffect, useRef } from 'react'

const QUOTES = [
  { text: 'Našiel si dnes svojich 5 minút pre seba?', author: null },
  { text: 'Pomalosť nie je lenivosť. Je to odvaha byť prítomný.', author: null },
  { text: 'Žurnálovanie nie je o tom, čo si napíšeš. Je o tom, čo objavíš.', author: null },
  { text: 'Nestihol si dnes spomaliť? Práve teraz je ten správny moment.', author: null },
  { text: 'Tichosť nie je prázdnota — je to priestor, kde sa rodí jasnosť.', author: null },
  { text: 'Čo by sa stalo, keby si dnes urobil o jednu vec menej, ale naplno?', author: null },
  { text: 'Skoro ráno je jediný čas, keď ti ho ešte nikto nestihol vziať.', author: null },
  { text: 'Nestíhame žiť, pretože nestíhame stáť.', author: null },
  { text: 'Buď tu. Nie neskôr. Teraz.', author: null },
  { text: 'Najdôležitejší zápis v denníku je ten, ktorý si ešte len chystáš napísať.', author: null },
  { text: 'Keď si naposledy sedel bez telefónu a len tak bol?', author: null },
  { text: 'Rýchlosť je ilúzia produktivity.', author: null },
  { text: 'Pomaly ďalej zájdeš.', author: 'slovenské príslovie' },
  { text: 'Súčasný okamih bude vždy existovať — si v ňom?', author: null },
  { text: 'Každý deň ti dáva 1 440 minút. Koľko z nich bolo skutočne tvojich?', author: null },
  { text: 'Ticho nie je nuda. Je to luxus, ktorý sme zabudli si dopriať.', author: null },
  { text: 'Čo dnes napíšeš do svojho denníka?', author: null },
  { text: 'Nie je dôležité robiť viac. Je dôležité robiť to, na čom záleží.', author: null },
]

export default function CoffeeTrans({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(5)
  const quote = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    if (count <= 0) { onDone(); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center page-enter"
      style={{ background: '#fafaf8', padding: '0 32px' }}
    >
      <svg width="88" height="96" viewBox="-4 -12 92 104" style={{ marginBottom: 32 }}>
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
        style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 42, color: '#1a1a1a', fontWeight: 700, marginBottom: 24 }}
      >
        {count}
      </div>

      <p style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 18, color: '#555', textAlign: 'center', maxWidth: 420, lineHeight: 1.7, marginBottom: 8 }}>
        „{quote.current.text}"
      </p>
      {quote.current.author && (
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 12, color: '#bbb', marginBottom: 32 }}>
          — {quote.current.author}
        </p>
      )}
      {!quote.current.author && <div style={{ marginBottom: 32 }} />}

      <button
        onClick={onDone}
        style={{ border: '1.5px solid #e0dcd6', borderRadius: 99, padding: '8px 24px', fontSize: 13, fontFamily: 'var(--font-inter), sans-serif', background: 'transparent', color: '#bbb', cursor: 'pointer' }}
      >
        preskočiť →
      </button>
    </div>
  )
}
