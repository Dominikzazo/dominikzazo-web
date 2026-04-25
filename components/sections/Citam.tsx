import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import type { SectionId } from '@/app/page'

interface Book {
  title: string
  author: string
  status: 'práve čítam' | 'prečítané' | 'chcem čítať'
  year: number | null
  note: string | null
  tags: string[]
}

const BOOKS: Book[] = [
  { title: 'O pôvode prosperity',  author: 'Rob Chovanculiak',    status: 'práve čítam', year: 2025, note: 'Konečne ekonómia, ktorá mi dáva zmysel.',       tags: ['ekonómia', 'filozofia'] },
  { title: 'Inspirace Baťa',       author: 'Gabriela Končitíková', status: 'práve čítam', year: 2025, note: 'Baťa bol možno najväčší slow thinker v biznise.', tags: ['história', 'inšpirácia'] },
  { title: 'Stillness Is the Key', author: 'Ryan Holiday',         status: 'prečítané',   year: 2025, note: 'Najlepšia knižka o tichu, ktorú som čítal.',      tags: ['ticho', 'filozofia'] },
  { title: "The Artist's Way",     author: 'Julia Cameron',        status: 'prečítané',   year: 2024, note: 'Ranné strany mi zmenili život. Vážne.',           tags: ['kreativita', 'žurnálovanie'] },
  { title: 'Slow',                 author: 'Brooke McAlary',       status: 'prečítané',   year: 2024, note: 'Praktické a ľudské. Odporúčam každému.',          tags: ['spomalenie'] },
  { title: 'In Praise of Slowness',author: 'Carl Honoré',          status: 'chcem čítať', year: null, note: null,                                              tags: ['spomalenie'] },
]

const STATUS_COLOR: Record<string, string> = {
  'práve čítam': '#7aaa7e',
  'prečítané':   '#bbb',
  'chcem čítať': '#c9a96e',
}

export default function Citam({ go: _ }: { go: (id: SectionId) => void }) {
  return (
    <div className="page-enter page-pad" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
        čítam.
      </h2>

      <div style={{ display: 'flex', gap: 14, marginBottom: 48, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: c, display: 'inline-block' }} />
            {s}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {BOOKS.map((b, i) => (
          <Card key={i} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: STATUS_COLOR[b.status], fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: STATUS_COLOR[b.status], display: 'inline-block' }} />
                {b.status}
              </span>
              {b.year && <span style={{ fontSize: 11, color: '#ddd' }}>{b.year}</span>}
            </div>
            <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>
              {b.title}
            </h3>
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: b.note ? 12 : 0 }}>{b.author}</p>
            {b.note && (
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', borderTop: '1px solid #f0f0ee', paddingTop: 12 }}>
                „{b.note}"
              </p>
            )}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
              {b.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
