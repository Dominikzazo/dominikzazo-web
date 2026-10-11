'use client'
import Tag from '@/components/ui/Tag'
import type { SectionId } from '@/app/page'
import type { HomepageData, Book } from '@/lib/cms/types'
import { DEFAULT_HOMEPAGE } from '@/lib/cms/store'

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

interface HomeProps {
  go: (id: SectionId) => void
  homepage?: HomepageData
  books?: Book[]
}

export default function Home({ go, homepage, books }: HomeProps) {
  const h = homepage ?? DEFAULT_HOMEPAGE
  const currentBook = books?.find((b) => b.status === 'práve čítam') ?? books?.[0] ?? {
    title: 'O pôvode prosperity',
    author: 'Rob Chovanculiak',
    tags: ['čítam'],
  }

  const bento = [
    { type: 'photo' as const, src: h.photo1Src, label: h.photo1Label },
    { type: 'quote' as const, text: h.quoteText, tags: h.quoteTags },
    { type: 'book' as const, title: currentBook.title, author: currentBook.author, tags: currentBook.tags.length > 0 ? currentBook.tags : ['čítam'] },
    { type: 'now' as const, text: h.nowText },
    { type: 'photo' as const, src: h.photo2Src, label: h.photo2Label },
    { type: 'thought' as const, title: 'O rannom písaní', preview: 'Každé ráno päť minút. Bez tlaku, bez cieľa...', tags: ['myšlienky'] },
  ]

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div className="home-split">
        {/* Left: intro */}
        <div>
          <div style={{ fontSize: 13, color: '#aaa', letterSpacing: '0.06em', marginBottom: 28 }}>
            dominikzazo.sk
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-lora), serif',
              fontSize: 40,
              fontWeight: 500,
              lineHeight: 1.25,
              color: '#1a1a1a',
              marginBottom: 28,
              letterSpacing: '-0.01em',
            }}
          >
            {h.greeting}
          </h1>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            <FormattedText text={h.bio1} />
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
            <FormattedText text={h.bio2} />
          </p>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.85, marginBottom: 48 }}>
            <FormattedText text={h.tagline} />
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { l: 'myšlienky →', t: 'myslienky' as SectionId },
              { l: 'o mne →', t: 'o-mne' as SectionId },
            ].map((b) => (
              <button
                key={b.t}
                onClick={() => go(b.t)}
                style={{
                  border: '1.5px solid #e0e0dc',
                  borderRadius: 99,
                  padding: '10px 22px',
                  fontSize: 14,
                  fontFamily: 'var(--font-inter), sans-serif',
                  background: 'transparent',
                  color: '#444',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.color = '#fafaf8'
                  e.currentTarget.style.borderColor = '#1a1a1a'
                }}
                onMouseLeave={(e) => {
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
          {bento.map((e, i) => (
            <div
              key={i}
              className={i === 0 || i === 4 ? 'bento-float' : undefined}
              style={{
                background: '#fff',
                borderRadius: 22,
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                padding: e.type === 'photo' ? 0 : 20,
                animationDelay: i === 4 ? '-3.5s' : undefined,
              }}
            >
              {e.type === 'photo' && (
                <img
                  src={e.src}
                  alt={e.label}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
              {e.type === 'quote' && (
                <>
                  <p
                    style={{
                      fontSize: 14,
                      fontFamily: 'var(--font-lora), serif',
                      fontStyle: 'italic',
                      color: '#333',
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {e.text}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {e.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </>
              )}
              {e.type === 'book' && (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      color: '#aaa',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    momentálne čítam 📖
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontFamily: 'var(--font-lora), serif',
                      fontWeight: 600,
                      color: '#1a1a1a',
                      marginBottom: 4,
                    }}
                  >
                    {e.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{e.author}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {e.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </>
              )}
              {e.type === 'now' && (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      color: '#7aaa7e',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    ○ teraz
                  </div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{e.text}</div>
                </>
              )}
              {e.type === 'thought' && (
                <>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                    {e.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontFamily: 'var(--font-lora), serif',
                      fontWeight: 600,
                      color: '#1a1a1a',
                      marginBottom: 5,
                    }}
                  >
                    {e.title}
                  </div>
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
