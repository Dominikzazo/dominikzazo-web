import Card from '@/components/ui/Card'
import type { SectionId } from '@/app/page'
import type { MonthlyEdit } from '@/lib/cms/types'

export default function Maj({ go: _, monthly }: { go: (id: SectionId) => void; monthly: MonthlyEdit }) {
  return (
    <div className="page-enter page-pad" style={{ maxWidth: 680, margin: '28px auto 0' }}>
      <div style={{ fontSize: 13, color: '#aaa', letterSpacing: '0.06em', marginBottom: 14, fontFamily: 'var(--font-inter), sans-serif' }}>
        {monthly.label}
      </div>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.02em' }}>
        {monthly.heading}
      </h2>
      <p style={{ color: '#aaa', fontSize: 15, marginBottom: 36, fontFamily: 'var(--font-inter), sans-serif' }}>
        {monthly.subtitle}
      </p>

      <Card style={{ padding: '32px 36px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#7aaa7e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
          jedna hlavná vec
        </div>
        <p style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 12 }}>
          {monthly.mainTitle}
        </p>
        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7 }}>
          {monthly.mainText}
        </p>
      </Card>

      {monthly.intentions.map((item, idx) => (
        <div
          key={idx}
          style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: idx < monthly.intentions.length - 1 ? '1px solid #f0f0ee' : 'none' }}
        >
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.emoji}</span>
          <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, fontFamily: 'var(--font-lora), serif' }}>{item.text}</p>
        </div>
      ))}

      <div style={{ marginTop: 40, background: '#f7f7f4', borderRadius: 18, padding: '20px 24px' }}>
        <p style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 22, color: '#888', lineHeight: 1.6 }}>
          {monthly.quote}
        </p>
      </div>
    </div>
  )
}
