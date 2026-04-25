import Card from '@/components/ui/Card'
import type { SectionId } from '@/app/page'

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  borderRadius: 99,
  padding: '13px 26px',
  fontSize: 14,
  fontFamily: 'var(--font-inter), sans-serif',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'all 0.22s',
}

export default function Projekty({ go: _ }: { go: (id: SectionId) => void }) {
  return (
    <div className="page-enter" style={{ maxWidth: 760, margin: '0 auto', padding: '120px 32px 80px' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
        projekty. 🟠
      </h2>
      <p style={{ color: '#aaa', fontSize: 15, marginBottom: 56, fontFamily: 'var(--font-inter), sans-serif' }}>
        Veci, na ktorých pracujem alebo mi záleží.
      </p>

      {/* Bitcoin dark card */}
      <div style={{ background: '#111', borderRadius: 24, padding: 40, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, background: '#f7931a', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.28, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, fontSize: 120, opacity: 0.06, lineHeight: 1, userSelect: 'none', pointerEvents: 'none', color: '#f7931a' }}>₿</div>
        <div style={{ fontSize: 11, color: '#f7931a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 600 }}>
          bitcoinový konzultant
        </div>
        <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 32, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
          Bitcoinová škola.
        </h3>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 28, maxWidth: 500 }}>
          Nie preto, že som prehajpovaný z kryptomien. Ale preto, že bitcoin chráni tvoj čas a prácu pred infláciou.
          Od človeka, ktorý nevie čiarku z bitcoinu, po pravidelné a rozumné sporenie. 🔐
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="https://bitcoinovaskola.sk"
            target="_blank"
            rel="noreferrer"
            style={{ ...btnBase, background: '#f7931a', color: '#fff', boxShadow: '0 4px 28px rgba(247,147,26,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 10px 44px rgba(247,147,26,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 28px rgba(247,147,26,0.45)' }}
          >
            <span style={{ fontSize: 18 }}>₿</span> Bitcoinová škola ↗
          </a>
          <a
            href="https://bitcoinovaskola.sk/quiz"
            target="_blank"
            rel="noreferrer"
            style={{ ...btnBase, border: '1.5px solid rgba(247,147,26,0.35)', color: 'rgba(255,255,255,0.65)', background: 'transparent', fontWeight: 400 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f7931a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(247,147,26,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
          >
            🧠 Quiz zadarmo
          </a>
        </div>
      </div>

      {/* Quiz info */}
      <div style={{ background: '#fff9f3', borderRadius: 16, padding: '16px 20px', border: '1.5px solid rgba(247,147,26,0.18)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 20 }}>🧠</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>Quiz zadarmo, personalizovaný priamo pre teba</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>
            Najlepší štart do Bitcoinu:{' '}
            <a href="https://bitcoinovaskola.sk/quiz" target="_blank" rel="noreferrer" style={{ color: '#f7931a', textDecoration: 'none' }}>
              bitcoinovaskola.sk/quiz ↗
            </a>
          </div>
        </div>
      </div>

      {/* Substack card */}
      <Card style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>✍️</div>
          <div>
            <div style={{ fontSize: 11, color: '#ff6719', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500 }}>substack newsletter</div>
            <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
              (Ako) Žiť uvedomelý život.
            </h3>
            <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>
              Myšlienky o spomalení, žurnálovaní a vedomom živote. Priamo do tvojho emailu. Pomaly, ako to tu máme radi.
            </p>
            <a
              href="https://dominikzazo.substack.com"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ff6719', borderRadius: 99, padding: '10px 22px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500, color: '#fff', textDecoration: 'none' }}
            >
              Čítaj na Substack ↗
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
