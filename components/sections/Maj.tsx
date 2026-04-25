import Card from '@/components/ui/Card'
import type { SectionId } from '@/app/page'

const INTENTIONS = [
  { emoji: '🚄', text: 'Plánovaný výlet rýchlikom niekde nové. Destinácia: surprise.' },
  { emoji: '📷', text: 'Odfotiť aspoň 5 vecí, ktoré by väčšina ľudí prehliadla.' },
  { emoji: '🚲', text: 'Prvá dlhšia jarná jazda na bicykli. Cesta, nie cieľ.' },
  { emoji: '🙏', text: 'Ráno tichšie ako minulý mesiac. Päť minút naviac.' },
  { emoji: '📖', text: 'Dokončiť Inspiráciu Baťa a napísať si tri veci, čo si z toho beriem.' },
]

export default function Maj({ go: _ }: { go: (id: SectionId) => void }) {
  return (
    <div className="page-enter page-pad" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ fontSize: 13, color: '#aaa', letterSpacing: '0.06em', marginBottom: 16, fontFamily: 'var(--font-inter), sans-serif' }}>
        apríl → máj 2025
      </div>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
        máj. 🌸
      </h2>
      <p style={{ color: '#aaa', fontSize: 15, marginBottom: 56, fontFamily: 'var(--font-inter), sans-serif' }}>
        Čo ma čaká tento mesiac. Živý zápisník.
      </p>

      <Card style={{ padding: '32px 36px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#7aaa7e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
          jedna hlavná vec
        </div>
        <p style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 12 }}>
          Čítať viac, scrollovať menej. 📵
        </p>
        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7 }}>
          Experiment: každý deň aspoň 30 minút skutočnej knihy pred tým, než siahnem po telefóne.
        </p>
      </Card>

      {INTENTIONS.map((item, idx) => (
        <div
          key={idx}
          style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: idx < INTENTIONS.length - 1 ? '1px solid #f0f0ee' : 'none' }}
        >
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.emoji}</span>
          <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, fontFamily: 'var(--font-lora), serif' }}>{item.text}</p>
        </div>
      ))}

      <div style={{ marginTop: 40, background: '#f7f7f4', borderRadius: 18, padding: '20px 24px' }}>
        <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 22, color: '#888', lineHeight: 1.6 }}>
          &ldquo;Máj je jediný mesiac, kde každý ráno vyzerá ako sľub.&rdquo; 🌿
        </p>
      </div>
    </div>
  )
}
