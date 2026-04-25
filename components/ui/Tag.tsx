import { ReactNode } from 'react'

export default function Tag({ children, bg, color }: { children: ReactNode; bg?: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 9px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.03em',
        background: bg ?? '#eef2eb',
        color: color ?? '#5a7a56',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {children}
    </span>
  )
}
