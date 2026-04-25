'use client'
import { useState } from 'react'
import type { SectionId } from '@/app/page'

const FUN_FACTS = [
  { e: '☕', t: 'Chemex adept',        d: 'Pomalá káva pre pomalý deň.' },
  { e: '🧦', t: 'Parkside fanúšik',    d: 'Lidl merch je underrated.' },
  { e: '🟠', t: 'Bitcoin konzultant',   d: 'Chráni tvoj čas pred infláciou.' },
  { e: '🚄', t: 'Vlakový nájomník',     d: 'Považan, Bratislava, Považan...' },
  { e: '🏐', t: 'Amatér volejbalista',  d: 'Profík na skórovanie. 😄' },
  { e: '🌺', t: 'Havajské košele',      d: 'Gýčové? Áno. Obanovaním? Nikdy.' },
  { e: '🚲', t: 'Bicykel',              d: 'Cesta, nie cieľ. Vždy.' },
  { e: '🙏', t: 'ZMM a viera',          d: 'Mariánska mládež, každodenná.' },
  { e: '🥤', t: 'Kofola závislosť',     d: '...závislosť je silné slovo. Alebo nie? :OO' },
]

const NAV_CARDS = [
  { label: 'myšlienky.', desc: 'Reflexie z denníka',       target: 'myslienky' as SectionId, bg: '#1a1a1a' },
  { label: 'projekty. 🟠', desc: 'Bitcoin + Substack',    target: 'projekty'  as SectionId, bg: '#1a1a1a' },
  { label: 'cestovanie.',  desc: 'Kde som bol, kam idem',   target: 'cestovanie' as SectionId, bg: '#2a2a2a' },
  { label: 'máj. 🌸',     desc: 'Čo ma čaká tento mesiac', target: 'maj'        as SectionId, bg: '#2a2a2a' },
]

function NavCard({ card, go }: { card: typeof NAV_CARDS[0]; go: (id: SectionId) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => go(card.target)}
      style={{
        background: card.bg,
        borderRadius: 20,
        padding: 22,
        cursor: 'pointer',
        position: 'relative',
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s',
        boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.22)' : '0 2px 12px rgba(0,0,0,0.12)',
      }}
    >
      <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>↗</span>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontFamily: 'var(--font-inter), sans-serif' }}>{card.desc}</div>
      <div style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{card.label}</div>
    </div>
  )
}

export default function OMne({ go }: { go: (id: SectionId) => void }) {
  return (
    <div className="page-enter page-pad" style={{ maxWidth: 740, margin: '0 auto' }}>

      {/* Hero row */}
      <div className="omne-hero">
        <div>
          <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
            o mne.
          </h2>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.85, marginBottom: 20, fontFamily: 'var(--font-lora), serif' }}>
            Ahoj! Som Dominik, mám 22 rokov, som z Považana a snažím sa žiť pomaly v dobe, ktorá nás všetkých tlačí do rýchlosti. 🌱
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            Ráno začínam <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Chemexom</strong> ☕, potom žurnálujem a až potom sa pozriem na telefón. Pracujem v <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Amityage</strong> a popri tom pomáham ľuďom porozumieť <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Bitcoinu</strong>. 🟠
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            Fanúšik <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Mariánskej mládeže</strong> 🙏, amatérsky <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>volejbalista</strong> 🏐 a profesionálny užívač <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>skórovania</strong> 😄. Kofola je moja slabosť. Závislosť? Možno. :OO
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 0 }}>
            Milujem <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>gýčové havajské košele</strong> 🌺 a kto povie, že Traja pátrači nie sú top, nemáme čo riešiť.
          </p>
        </div>
        <img
          src="/uploads/IMG_9642_2.JPG"
          alt="Dominik"
          style={{ width: '100%', height: 280, objectFit: 'cover', objectPosition: 'center top', borderRadius: 20, display: 'block' }}
        />
      </div>

      {/* Fun facts grid */}
      <div className="facts-grid">
        {FUN_FACTS.map((f, i) => (
          <div key={i} style={{ background: '#f7f7f5', borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, marginBottom: 7 }}>{f.e}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{f.t}</div>
            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{f.d}</div>
          </div>
        ))}
      </div>

      {/* Photo gallery */}
      <div className="photo-gallery">
        <img src="/uploads/IMG_3451.JPG" alt="túra" style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: 'center top', borderRadius: 16, display: 'block', transform: 'rotate(-2.5deg)', boxShadow: '0 6px 24px rgba(0,0,0,0.10)' }} />
        <img src="/uploads/IMG_0932.JPG" alt="Rím" style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center top', borderRadius: 16, display: 'block', transform: 'rotate(1deg) translateY(-10px)', boxShadow: '0 6px 24px rgba(0,0,0,0.10)' }} />
        <img src="/uploads/IMG_2923.JPG" alt="výlet" style={{ width: '100%', height: 190, objectFit: 'cover', objectPosition: 'center 30%', borderRadius: 16, display: 'block', transform: 'rotate(2deg)', boxShadow: '0 6px 24px rgba(0,0,0,0.10)' }} />
      </div>

      {/* Two modes */}
      <div style={{ marginBottom: 48 }}>
        <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 24, fontWeight: 500, color: '#1a1a1a', marginBottom: 28 }}>dva módy. 😅</h3>
        <div className="dva-mody">
          {/* Unconscious */}
          <div>
            <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 21, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 14 }}>
              takto sa tvárim keď nežiješ vedome 😵
            </p>
            <div style={{ position: 'relative', height: 230 }}>
              <img src="/uploads/IMG_8209.JPG" alt="nevedome" style={{ position: 'absolute', left: 0, top: 0, width: '52%', height: 210, objectFit: 'cover', objectPosition: 'center 20%', borderRadius: 14, display: 'block', transform: 'rotate(-3deg)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
              <img src="/uploads/IMG_8167.JPG" alt="nevedome2" style={{ position: 'absolute', right: 0, top: 16, width: '52%', height: 210, objectFit: 'cover', objectPosition: 'center 55%', borderRadius: 14, display: 'block', transform: 'rotate(2.5deg)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
              <svg style={{ position: 'absolute', top: 10, left: '22%', zIndex: 3, pointerEvents: 'none' }} width="60" height="80" viewBox="0 0 60 80">
                <defs><marker id="b1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 Z" fill="#1a1a1a" /></marker></defs>
                <path d="M 50,75 Q 30,50 18,20" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" markerEnd="url(#b1)" />
              </svg>
              <svg style={{ position: 'absolute', top: 24, right: '18%', zIndex: 3, pointerEvents: 'none' }} width="60" height="70" viewBox="0 0 60 70">
                <defs><marker id="b2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 Z" fill="#1a1a1a" /></marker></defs>
                <path d="M 10,68 Q 30,44 42,16" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" markerEnd="url(#b2)" />
              </svg>
            </div>
          </div>
          {/* Conscious */}
          <div>
            <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 21, color: '#5a9a5e', lineHeight: 1.4, marginBottom: 14 }}>
              takto keď žiješ podľa svojho vnútra 😌
            </p>
            <div style={{ position: 'relative' }}>
              <img src="/uploads/IMG_8054.JPG" alt="vedome" style={{ width: '100%', height: 230, objectFit: 'cover', objectPosition: 'center 30%', borderRadius: 16, display: 'block', transform: 'rotate(1.5deg)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
              <svg style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 3, pointerEvents: 'none' }} width="70" height="80" viewBox="0 0 70 80">
                <defs><marker id="b3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 Z" fill="#5a9a5e" /></marker></defs>
                <path d="M 60,72 Q 40,48 25,18" stroke="#5a9a5e" strokeWidth="2.5" fill="none" strokeLinecap="round" markerEnd="url(#b3)" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Apple-style dark nav cards */}
      <div style={{ borderTop: '1px solid #ebebea', paddingTop: 40, marginBottom: 40 }}>
        <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 18, fontWeight: 500, color: '#aaa', marginBottom: 20, letterSpacing: '0.02em' }}>
          kde ma nájdeš.
        </h3>
        <div className="nav-cards-grid">
          {NAV_CARDS.map(card => <NavCard key={card.target} card={card} go={go} />)}
        </div>
      </div>

      <a
        href="mailto:dominik@dominikzazo.sk"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #e0e0dc', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', color: '#444', textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a1a1a' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = '#e0e0dc' }}
      >
        napíš mi →
      </a>
    </div>
  )
}
