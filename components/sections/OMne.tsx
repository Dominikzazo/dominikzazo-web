'use client'
import { useState } from 'react'
import type { SectionId } from '@/app/page'
import type { MonthlyEdit, AboutData } from '@/lib/cms/types'
import { DEFAULT_ABOUT } from '@/lib/cms/store'

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ color: '#1a1a1a', fontWeight: 500 }}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })}
    </>
  )
}

interface NavCardDef {
  label: string
  desc: string
  target: SectionId
  bg: string
}

// Mesačná karta berie label z CMS (monthly.heading) — mení sa spolu s menu
const navCards = (monthlyHeading: string): NavCardDef[] => [
  { label: 'myšlienky.', desc: 'Reflexie z denníka', target: 'myslienky', bg: '#1a1a1a' },
  { label: 'projekty. 🟠', desc: 'Bitcoin + Substack', target: 'projekty', bg: '#1a1a1a' },
  { label: 'cestovanie.', desc: 'Kde som bol, kam idem', target: 'cestovanie', bg: '#2a2a2a' },
  { label: monthlyHeading, desc: 'Čo ma čaká tento mesiac', target: 'maj', bg: '#2a2a2a' },
]

function NavCard({ card, go }: { card: NavCardDef; go: (id: SectionId) => void }) {
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

interface OMneProps {
  go: (id: SectionId) => void
  monthly: MonthlyEdit
  about?: AboutData
}

export default function OMne({ go, monthly, about }: OMneProps) {
  const a = about ?? DEFAULT_ABOUT

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 740, margin: '0 auto' }}>

      {/* Hero row */}
      <div className="omne-hero">
        <div>
          <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
            {a.title}
          </h2>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.85, marginBottom: 20, fontFamily: 'var(--font-lora), serif' }}>
            <FormattedText text={a.bio1} />
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            <FormattedText text={a.bio2} />
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            <FormattedText text={a.bio3} />
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 0 }}>
            <FormattedText text={a.bio4} />
          </p>
        </div>
        <img
          src={a.photoSrc}
          alt="Dominik"
          style={{ width: '100%', height: 280, objectFit: 'cover', objectPosition: 'center top', borderRadius: 20, display: 'block' }}
        />
      </div>

      {/* Fun facts grid */}
      <div className="facts-grid">
        {a.facts.map((f, i) => (
          <div key={i} style={{ background: '#f7f7f5', borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, marginBottom: 7 }}>{f.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>{f.desc}</div>
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
          {navCards(monthly.heading).map(card => <NavCard key={card.target} card={card} go={go} />)}
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
