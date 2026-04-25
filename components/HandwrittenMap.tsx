import type { MapCity } from '@/components/sections/Cestovanie'

const mp = (lon: number, lat: number) => ({
  x: Math.round(((lon + 30) / 95) * 880),
  y: Math.round(((73 - lat) / 53) * 520),
})

const DOT_COLOR: Record<string, string> = {
  home: '#1a1a1a',
  visited: '#5a9a5e',
  last: '#c06060',
  wishlist: '#c9a96e',
}

const pillWidth = (city: MapCity) => (city.emoji.length + city.name.length) * 6.8 + 22

// Pre-computed coordinates for all land paths
// Projection: x = ((lon+30)/95)*880, y = ((73-lat)/53)*520

export default function HandwrittenMap({ onHover }: { onHover: (city: MapCity | null) => void }) {
  return (
    <svg
      viewBox="0 0 880 520"
      style={{ width: '100%', display: 'block', background: '#fdf9f0', borderRadius: 20, border: '1px solid #ebe6dc' }}
    >
      <defs>
        <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.018" numOctaves={2} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.2} xChannelSelector="R" yChannelSelector="G" />
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

      <g filter="url(#rough)" stroke="#a89880" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" fill="#ede6d4">

        {/* ── MAINLAND EUROPE ── */}
        {/* Pyrenees/Basque → Bay of Biscay → Brittany → Channel → Netherlands →
            Germany → Poland coast → Baltic states → Russia → Ukraine → Black Sea →
            Bulgaria → Greece → Adriatic coast → N Italy → French Riviera → back */}
        <path d="
          M 266,280
          Q 260,267 266,257
          Q 252,244 236,234
          Q 249,221 270,215
          L 293,209 L 310,205 L 322,187 L 354,176
          L 408,181 L 462,175 L 499,132
          Q 527,130 554,127
          Q 573,163 573,205
          L 630,224 L 636,253
          Q 598,268 554,270
          L 536,290 L 536,312
          Q 522,312 508,313
          Q 508,342 481,357
          Q 469,347 462,330
          L 450,318 L 448,300 L 426,291
          Q 415,278 402,268
          Q 386,268 360,281
          Q 337,280 307,280
          Q 290,280 266,280 Z
        " />

        {/* ── IBERIAN PENINSULA ── */}
        <path d="
          M 307,280
          Q 252,280 194,289
          L 191,352
          Q 205,358 222,357
          Q 227,362 231,362
          Q 255,352 278,342
          Q 283,328 305,288
          L 307,280 Z
        " />

        {/* ── ITALIAN BOOT ── */}
        <path d="
          M 322,280
          Q 340,278 359,281
          Q 371,280 381,295
          Q 393,308 408,328
          L 421,340
          L 426,334 L 444,326 L 448,322
          Q 437,308 426,291
          Q 412,276 394,270
          Q 392,268 390,268
          Q 401,268 402,268
          Q 386,275 362,280
          L 322,280 Z
        " />

        {/* ── SCANDINAVIA + DENMARK + FINLAND ── */}
        <path d="
          M 354,176
          Q 356,162 361,143
          Q 378,155 399,170
          L 444,152
          Q 470,136 499,127
          Q 508,103 508,79
          Q 521,54 536,29
          Q 496,28 452,31
          Q 424,44 408,51
          Q 383,91 340,100
          Q 326,116 322,127
          Q 326,134 333,137
          Q 345,154 354,176 Z
        " />

        {/* ── GREAT BRITAIN ── */}
        <path d="
          M 231,225
          Q 261,210 292,209
          Q 280,196 270,162
          Q 252,148 231,147
          Q 222,168 231,196
          Q 231,211 231,225 Z
        " />

        {/* ── IRELAND ── */}
        <path d="
          M 185,210
          Q 203,210 213,196
          Q 204,181 185,181
          Q 180,196 185,210 Z
        " />

        {/* ── TURKEY + CAUCASUS ── */}
        <path d="
          M 545,313
          Q 580,299 636,295
          L 666,295 L 720,293
          Q 710,318 693,337
          L 675,352
          Q 638,360 600,362
          Q 560,357 544,357
          Q 530,343 517,343
          Q 526,326 536,312
          L 545,313 Z
        " />

        {/* ── N AFRICA EDGE (bottom of map) ── */}
        <path d="
          M 0,460 Q 140,452 220,455 Q 360,448 480,452
          Q 600,446 720,450 L 880,446 L 880,520 L 0,520 Z
        " fill="#e5dece" stroke="none" />

        {/* Canary Islands region (tiny dots) */}
        <circle cx="127" cy="438" r="5" />
        <circle cx="108" cy="444" r="3.5" />

        {/* Corsica */}
        <ellipse cx="340" cy="306" rx="7" ry="12" transform="rotate(-20 340 306)" />
        {/* Sardinia */}
        <ellipse cx="336" cy="326" rx="8" ry="14" transform="rotate(-15 336 326)" />
        {/* Sicily */}
        <ellipse cx="393" cy="336" rx="14" ry="8" transform="rotate(-10 393 336)" />
        {/* Crete */}
        <ellipse cx="480" cy="370" rx="18" ry="5" transform="rotate(-5 480 370)" />

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
