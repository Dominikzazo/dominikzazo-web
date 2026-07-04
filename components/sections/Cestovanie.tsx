'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import HandwrittenMap, { DOT_COLOR } from '@/components/HandwrittenMap'
import type { SectionId } from '@/app/page'
import type { Place } from '@/lib/cms/types'

// Spätná kompatibilita typu pre HandwrittenMap
export type MapCity = Pick<Place, 'name' | 'lon' | 'lat' | 'status' | 'emoji' | 'note'>

type Filter = 'all' | 'visited' | 'last' | 'wishlist'

export default function Cestovanie({ go: _, places }: { go: (id: SectionId) => void; places: Place[] }) {
  const [hov, setHov] = useState<MapCity | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const onMapCities = places.filter(p => p.onMap)
  const offMap = places.filter(p => !p.onMap)
  const filtered = filter === 'all' ? places : places.filter(p => p.status === filter)

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 1000, margin: '28px auto 0' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.02em' }}>
        cestovanie.
      </h2>
      <p style={{ color: 'rgb(161,161,161)', fontSize: 15, marginBottom: 28, fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400 }}>
        Plánované aj random. Rýchlikom, vždy rýchlikom. 🚄
      </p>

      <div className="map-scroll">
        <HandwrittenMap onHover={setHov} cities={onMapCities} />
      </div>

      {hov && (
        <div
          className="animate-fade-in"
          style={{ marginTop: 14, padding: '14px 20px', background: '#fff', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <span style={{ fontSize: 22 }}>{hov.emoji}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-lora), serif', fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{hov.name}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{hov.note}</div>
          </div>
          <span
            style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px', borderRadius: 99, background: DOT_COLOR[hov.status] + '22', color: DOT_COLOR[hov.status], fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500 }}
          >
            {hov.status === 'home' ? 'domov' : hov.status === 'visited' ? 'navštívené' : hov.status === 'last' ? 'naposledy' : 'wishlist'}
          </span>
        </div>
      )}

      {offMap.map(p => (
        <div key={p.id} style={{ marginTop: 14, padding: '14px 20px', background: '#fff8ee', borderRadius: 16, border: '1.5px dashed #c9a96e', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 20 }}>{p.emoji}</span>
          <span style={{ fontSize: 13, color: '#888' }}>
            <strong style={{ color: '#1a1a1a' }}>{p.name}</strong> je na mape mimo záber. {p.note}
          </span>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'visited', 'last', 'wishlist'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ border: 'none', borderRadius: 99, padding: '6px 16px', fontSize: 12, fontFamily: 'var(--font-inter), sans-serif', cursor: 'pointer', background: filter === f ? '#1a1a1a' : '#f0f0ee', color: filter === f ? '#fff' : '#666', transition: 'all 0.2s' }}
          >
            {f === 'all' ? 'všetko' : f === 'visited' ? 'bol som' : f === 'last' ? 'naposledy' : 'chcem ísť'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
        {filtered.map(p => (
          <Card key={p.id} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{p.emoji}</span>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: DOT_COLOR[p.status], display: 'inline-block' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-lora), serif', fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{p.note}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
