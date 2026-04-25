import type { MapCity } from '@/components/sections/Cestovanie'

const mp = (lon: number, lat: number) => ({
  x: ((lon + 30) / 95) * 880,
  y: ((73 - lat) / 53) * 520,
})

const DOT_COLOR: Record<string, string> = {
  home: '#1a1a1a',
  visited: '#5a9a5e',
  last: '#c06060',
  wishlist: '#c9a96e',
}

const pillWidth = (city: MapCity) => (city.emoji.length + city.name.length) * 6.8 + 22

export default function HandwrittenMap({ onHover }: { onHover: (city: MapCity | null) => void }) {
  return (
    <svg
      viewBox="0 0 880 520"
      style={{ width: '100%', display: 'block', background: '#fdf9f0', borderRadius: 20, border: '1px solid #ebe6dc' }}
    >
      <defs>
        <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.022" numOctaves={2} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.8} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <style>{`.mp:hover{opacity:.85;cursor:pointer}`}</style>
      </defs>

      {/* Paper grid */}
      {[...Array(9)].map((_, i) => (
        <line key={`v${i}`} x1={i * 110} y1="0" x2={i * 110} y2="520" stroke="#e8e2d8" strokeWidth="0.5" />
      ))}
      {[...Array(6)].map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 104} x2="880" y2={i * 104} stroke="#e8e2d8" strokeWidth="0.5" />
      ))}

      {/* Landmasses */}
      <g filter="url(#rough)" stroke="#a89880" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="#ede6d4">
        <path d="M194,304 L194,354 L228,366 L262,356 L244,246 L298,218 L324,198 L371,144 L407,170 L433,144 L491,79 L601,45 L645,54 L667,176 L714,180 L730,208 L666,292 L547,318 L483,357 L464,329 L428,306 L426,356 L405,348 L362,295 L344,293 C310,306 289,356 228,366 Z" />
        <path d="M0,440 L160,432 L280,436 L400,430 L520,434 L640,428 L760,432 L880,426 L880,520 L0,520 Z" fill="#e0d8c4" />
        <path d="M242,222 L255,212 L277,220 L284,234 L278,250 L262,254 L246,244 Z" />
        <path d="M242,222 L255,210 L260,196 L270,183 L279,191 L280,210 L263,218 Z" />
        <path d="M228,226 L240,220 L242,234 L235,242 L224,237 Z" />
        <path d="M198,116 L217,110 L234,116 L232,130 L215,134 L198,124 Z" />
        <circle cx="127" cy="440" r="9" />
      </g>

      {/* City dots + pills */}
      {MAP_CITIES_SVG.map(city => {
        const p = mp(city.lon, city.lat)
        const col = DOT_COLOR[city.status]
        const r = city.status === 'home' ? 7 : city.status === 'last' ? 9 : 5.5
        const pw = pillWidth(city)
        const px = Math.min(p.x + 14, 880 - pw - 4)
        const py = p.y - 28
        return (
          <g key={city.name} className="mp" onMouseEnter={() => onHover(city)} onMouseLeave={() => onHover(null)}>
            {city.status === 'last' && (
              <circle cx={p.x} cy={p.y} r={r + 8} fill={col} opacity="0.15" className="animate-float-y" />
            )}
            <circle cx={p.x} cy={p.y} r={r} fill={col} stroke="white" strokeWidth="1.8" />
            {city.status === 'wishlist' && (
              <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={col} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />
            )}
            <rect x={px} y={py} width={pw} height={19} rx={9.5} fill={col} opacity="0.92" />
            <text x={px + 10} y={py + 13} className="map-pill-label" fill="white">
              {city.emoji} {city.name}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <g fontFamily="var(--font-inter), sans-serif" fontSize="11" fill="#aaa">
        {[
          { c: DOT_COLOR.home, l: 'domov' },
          { c: DOT_COLOR.visited, l: 'navštívené' },
          { c: DOT_COLOR.last, l: 'naposledy' },
          { c: DOT_COLOR.wishlist, l: 'wishlist' },
        ].map((item, idx) => (
          <g key={item.l} transform={`translate(${16 + idx * 112}, 505)`}>
            <circle cx="6" cy="0" r="5" fill={item.c} />
            <text x="14" y="4">{item.l}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

const MAP_CITIES_SVG: MapCity[] = [
  { name: 'Bratislava', lon: 17.1, lat: 48.1, status: 'home',     emoji: '🏠', note: 'Môj domov, môj chaos, moja láska.' },
  { name: 'Praha',      lon: 14.4, lat: 50.1, status: 'visited',  emoji: '🍺', note: 'Starý Barrandov, Vltava, klobása.' },
  { name: 'Viedeň',    lon: 16.4, lat: 48.2, status: 'visited',  emoji: '☕', note: 'Kaviarňová kultúra na ďalšiu úroveň.' },
  { name: 'Budapešť',  lon: 19.0, lat: 47.5, status: 'visited',  emoji: '🌊', note: 'Kúpele Széchenyi, ruin bars, Dunaj.' },
  { name: 'Krakov',    lon: 19.9, lat: 50.1, status: 'visited',  emoji: '🥨', note: 'Stredoveká krása. Obedy za 4€.' },
  { name: 'Rím',       lon: 12.5, lat: 41.9, status: 'visited',  emoji: '🍕', note: 'Fontána di Trevi, pizza al taglio.' },
  { name: 'Tenerife',  lon: -16.3, lat: 28.3, status: 'last',    emoji: '🌋', note: 'Naposledy! Sopka Teide, západ slnka. 😍' },
  { name: 'Oslo',      lon: 10.7, lat: 59.9, status: 'wishlist', emoji: '🏔️', note: 'Fjordy, losos, a ceny čo ma zničia.' },
  { name: 'Edinburgh', lon: -3.2, lat: 55.9, status: 'wishlist', emoji: '🏰', note: 'Škótske hrady a whisky.' },
  { name: 'Tbilisi',   lon: 44.8, lat: 41.7, status: 'wishlist', emoji: '🍷', note: 'Gruzínske víno a khachapuri.' },
]

export { MAP_CITIES_SVG, DOT_COLOR }
