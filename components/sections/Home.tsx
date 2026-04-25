'use client'
import { useRef, useEffect } from 'react'
import Tag from '@/components/ui/Tag'
import type { SectionId } from '@/app/page'

const BENTO = [
  { type: 'photo',   src: '/uploads/IMG_1978_3.JPG', label: 'Chemex moment' },
  { type: 'quote',   text: 'Najlepšia rada na svete: nauč sa byť ticho, aspoň chvíľku. 🌿', tags: ['ticho'] },
  { type: 'book',    title: 'O pôvode prosperity', author: 'Rob Chovanculiak', tags: ['čítam'] },
  { type: 'now',     text: 'Teraz: druhá šálka z Chemexu a plánujem víkendový výlet rýchlikom. 🚄' },
  { type: 'photo',   src: '/uploads/IMG_0326_3.JPG', label: 'Niekde na svete' },
  { type: 'thought', title: 'O rannom písaní', preview: 'Každé ráno päť minút. Bez tlaku, bez cieľa...',  tags: ['myšlienky'] },
]

export default function Home({ go }: { go: (id: SectionId) => void }) {
  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const f = () => {
      const y = window.scrollY
      if (ref1.current) ref1.current.style.transform = `translateY(${y * 0.12}px)`
      if (ref2.current) ref2.current.style.transform = `translateY(${-y * 0.10}px)`
    }
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div className="home-split">

        {/* Left: intro */}
        <div>
          <div style={{ fontSize: 13, color: '#aaa', letterSpacing: '0.06em', marginBottom: 28 }}>dominikzazo.sk</div>
          <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 40, fontWeight: 500, lineHeight: 1.25, color: '#1a1a1a', marginBottom: 28, letterSpacing: '-0.01em' }}>
            Ahoj, ja som Dominik. 👋
          </h1>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            Mám 22 rokov, pijem{' '}
            <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Chemex</strong>{' '}
            ako keby od toho závisel život a moja najlepšia life advice?{' '}
            <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Nauč sa byť ticho, aspoň chvíľku.</strong>{' '}
            🌿
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            Baví ma <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>spomalenie</strong>, každý deň{' '}
            <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>žurnálujem</strong>, cestujem rýchlikom kedykoľvek sa dá 🚄 a tajne si myslím, že{' '}
            <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>Traja pátrači</strong> sú najlepšia detektívka ever.
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 48 }}>
            Toto je môj <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>vedomý kút internetu</strong>. Pomaly. Zámerne. Ľudsky.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[{ l: 'myšlienky →', t: 'myslienky' as SectionId }, { l: 'o mne →', t: 'o-mne' as SectionId }].map(b => (
              <button
                key={b.t}
                onClick={() => go(b.t)}
                style={{ border: '1.5px solid #e0e0dc', borderRadius: 99, padding: '10px 22px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', background: 'transparent', color: '#444', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.color = '#fafaf8'
                  e.currentTarget.style.borderColor = '#1a1a1a'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#444'
                  e.currentTarget.style.borderColor = '#e0e0dc'
                }}
              >
                {b.l}
              </button>
            ))}
          </div>
        </div>

        {/* Right: bento grid */}
        <div className="bento-grid">
          {BENTO.map((e, i) => (
            <div
              key={i}
              ref={i === 0 ? ref1 : i === 4 ? ref2 : undefined}
              style={{ background: '#fff', borderRadius: 22, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', overflow: 'hidden', padding: e.type === 'photo' ? 0 : 20 }}
            >
              {e.type === 'photo' && (
                <img src={e.src} alt={e.label} style={{ width: '100%', height: 'auto', display: 'block' }} />
              )}
              {e.type === 'quote' && (
                <>
                  <p style={{ fontSize: 14, fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', color: '#333', lineHeight: 1.6, marginBottom: 12 }}>{e.text}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {e.tags!.map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                </>
              )}
              {e.type === 'book' && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>momentálne čítam 📖</div>
                  <div style={{ fontSize: 15, fontFamily: 'var(--font-lora), serif', fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{e.author}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {e.tags!.map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                </>
              )}
              {e.type === 'now' && (
                <>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#7aaa7e', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>○ teraz</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{e.text}</div>
                </>
              )}
              {e.type === 'thought' && (
                <>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                    {e.tags!.map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                  <div style={{ fontSize: 15, fontFamily: 'var(--font-lora), serif', fontWeight: 600, color: '#1a1a1a', marginBottom: 5 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{e.preview}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
