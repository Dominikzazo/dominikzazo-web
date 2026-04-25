'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SectionId } from '@/app/page'

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'home',       label: 'domov' },
  { id: 'maj',        label: 'máj 🌸' },
  { id: 'myslienky',  label: 'myšlienky' },
  { id: 'citam',      label: 'čítam' },
  { id: 'cestovanie', label: 'cestovanie' },
  { id: 'projekty',   label: 'projekty 🟠' },
  { id: 'o-mne',      label: 'o mne' },
]

interface NavProps {
  active: SectionId
  go: (id: SectionId) => void
}

export default function Nav({ active, go }: NavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <nav
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-wrap gap-0.5 justify-center rounded-full border border-black/[0.07] py-[5px] px-[6px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-[background] duration-300"
      style={{
        background: scrolled ? 'rgba(250,250,248,0.92)' : 'rgba(250,250,248,0.7)',
        backdropFilter: 'blur(14px)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => go(item.id)}
          className="rounded-full px-[15px] py-[6px] text-[13px] transition-all duration-200 tracking-[0.01em]"
          style={{
            border: 'none',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: active === item.id ? 500 : 400,
            background: active === item.id ? '#1a1a1a' : 'transparent',
            color: active === item.id ? '#fafaf8' : '#666',
            cursor: 'pointer',
          }}
        >
          {item.label}
        </button>
      ))}
      <Link
        href="/slow-life"
        target="_blank"
        className="rounded-full px-[15px] py-[6px] text-[13px] tracking-[0.01em] transition-all duration-200 no-underline"
        style={{
          border: '1.5px solid #e0dcd6',
          fontFamily: 'var(--font-inter), sans-serif',
          color: '#888',
          background: 'transparent',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#1a1a1a'
          e.currentTarget.style.color = '#fafaf8'
          e.currentTarget.style.borderColor = '#1a1a1a'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#888'
          e.currentTarget.style.borderColor = '#e0dcd6'
        }}
      >
        ☕ pomalé ráno ↗
      </Link>
    </nav>
  )
}
