'use client'
import { useState, ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  onClick?: () => void
}

export default function Card({ children, style, className = '', onClick }: CardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white overflow-hidden transition-all duration-[250ms] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        borderRadius: 22,
        boxShadow: hovered
          ? '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)'
          : '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
