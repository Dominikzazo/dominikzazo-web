'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import type { SectionId } from '@/app/page'

interface Thought {
  slug?: string
  date?: string
  pubDate?: string
  title: string
  tags?: string[]
  preview?: string
  body?: string
  description?: string
  link?: string
  isSubstack?: boolean
}

const LOCAL_THOUGHTS: Thought[] = [
  {
    slug: 'vlaky', date: '12. apríla 2025',
    title: 'Prečo milujem vlaky 🚄',
    tags: ['cestovanie', 'pomalý život'],
    preview: 'Vlak ťa donúti sedieť a nič nerobiť. A to je presne to, čo potrebuješ.',
    body: 'Vlak ťa donúti sedieť a nič nerobiť. A to je presne to, čo potrebuješ.\n\nKeď cestujem autom alebo lietadlom, som v pohybe, ale nie naozaj prítomný. Vo vlaku si uvedomíš, že krajina plynie okolo a ty si len tam.\n\nPovažan som za vlakového nájomníka. Rýchlik Bratislava, Považan. Soundtrack dňa. 🚄',
  },
  {
    slug: 'rano', date: '24. apríla 2025',
    title: 'O rannom písaní',
    tags: ['žurnálovanie', 'rutina'],
    preview: 'Každé ráno päť minút. Bez tlaku, bez cieľa. Len pero a papier.',
    body: 'Každé ráno päť minút. Bez tlaku, bez cieľa.\n\nDlho som si myslel, že žurnálovanie je pre ľudí, ktorí majú čo povedať. Ja som mal len chaos.\n\nA práve preto to fungovalo. Chaos sa na papieri stáva čitateľným.\n\nPäť minút. Každý deň. To je všetko.',
  },
  {
    slug: 'ticho', date: '18. apríla 2025',
    title: 'Ticho v meste',
    tags: ['ticho', 'mestský život'],
    preview: 'Myslel som si, že ticho nájdem len v prírode. Mýlil som sa.',
    body: 'Myslel som si, že ticho nájdem len v prírode. Mýlil som sa.\n\nTicho nie je o absencii zvuku. Je to o prítomnosti. O tom, byť naozaj tam, kde si.\n\nAj uprostred mesta môžeš byť v tichu, ak si ho vybereš.',
  },
]

function ThoughtDetail({ t, onBack }: { t: Thought; onBack: () => void }) {
  return (
    <div className="page-enter" style={{ maxWidth: 660, margin: '0 auto', padding: '120px 32px 80px' }}>
      <button
        onClick={onBack}
        style={{ border: 'none', background: 'transparent', color: '#aaa', fontSize: 13, cursor: 'pointer', marginBottom: 48, fontFamily: 'var(--font-inter), sans-serif', padding: 0 }}
      >
        ← späť
      </button>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(t.tags ?? []).map(tg => <Tag key={tg}>{tg}</Tag>)}
        {t.isSubstack && <Tag bg="#ff6719" color="#fff">substack</Tag>}
      </div>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 34, fontWeight: 500, color: '#1a1a1a', marginBottom: 12, lineHeight: 1.25 }}>
        {t.title}.
      </h2>
      <div style={{ color: '#bbb', fontSize: 13, marginBottom: 48, fontFamily: 'var(--font-inter), sans-serif' }}>
        {t.date ?? (t.pubDate ? new Date(t.pubDate).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
      </div>
      {(t.body ?? t.description ?? '').split('\n\n').map((p, i) => (
        <p key={i} style={{ fontSize: 18, color: '#444', lineHeight: 1.85, marginBottom: 28, fontFamily: 'var(--font-lora), serif' }}>
          {p.replace(/<[^>]*>/g, '')}
        </p>
      ))}
      {t.link && (
        <a
          href={t.link}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #e0e0dc', borderRadius: 99, padding: '10px 22px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', color: '#444', textDecoration: 'none' }}
        >
          Čítaj na Substack ↗
        </a>
      )}
    </div>
  )
}

export default function Myslienky({ go: _ }: { go: (id: SectionId) => void }) {
  const [sel, setSel] = useState<Thought | null>(null)
  const [posts, setPosts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/substack')
      .then(r => r.json())
      .then(d => { if (d.items) setPosts(d.items.slice(0, 4)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (sel) return <ThoughtDetail t={sel} onBack={() => setSel(null)} />

  const all = [...LOCAL_THOUGHTS, ...posts.map(p => ({ ...p, isSubstack: true }))]

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
        myšlienky.
      </h2>
      <p style={{ color: '#aaa', fontSize: 15, marginBottom: 56, fontFamily: 'var(--font-inter), sans-serif' }}>
        Reflexie z denníka. Veci zo Substacku. Záznamy, ktoré stoja za to.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {all.map((t, i) => (
          <Card key={i} onClick={() => setSel(t)} style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {(t.tags ?? []).map(tg => <Tag key={tg}>{tg}</Tag>)}
                {t.isSubstack && <Tag bg="#ff6719" color="#fff">substack</Tag>}
              </div>
              <span style={{ fontSize: 12, color: '#ccc', fontFamily: 'var(--font-inter), sans-serif' }}>
                {t.date ?? (t.pubDate ? new Date(t.pubDate).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 21, fontWeight: 600, color: '#1a1a1a', marginBottom: 7, lineHeight: 1.3 }}>
              {t.title}
            </h3>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>
              {t.preview ?? (t.description?.replace(/<[^>]*>/g, '').slice(0, 120) + '...')}
            </p>
          </Card>
        ))}
        {loading && (
          <div style={{ textAlign: 'center', padding: 32, color: '#ccc', fontSize: 13 }}>
            načítavam Substack... ☕
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <a
          href="https://dominikzazo.substack.com"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #e0e0dc', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', color: '#444', textDecoration: 'none' }}
        >
          všetky články na Substack ↗
        </a>
      </div>
    </div>
  )
}
