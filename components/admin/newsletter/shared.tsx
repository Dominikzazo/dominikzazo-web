'use client'
import type { SequenceTrigger } from '@/lib/newsletter/types'

// Zdieľané farby a drobné UI kúsky pre admin newsletter builder.
// Prototyp (email_sequence_builder.html) používal CSS premenné (--surface-1,
// --text-primary…), ktoré v tomto projekte neexistujú (pozri app/globals.css) —
// nahrádzame ich konkrétnymi hodnotami konzistentnými so zvyškom webu
// (cream/ink paleta) + bitcoin oranžová #F7931A ako akcent pre tento nástroj.
export const BTC = '#F7931A'
export const BTC_LIGHT = 'rgba(247,147,26,0.09)'
export const BTC_BORDER = 'rgba(247,147,26,0.3)'

export const COLORS = {
  surface0: '#f2f1ec', // disabled / najsvetlejší podklad
  surface1: '#ffffff', // input pozadie
  surface2: '#ffffff', // karty
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.14)',
  bgSuccess: '#eaf5ec',
  textSuccess: '#3f8f52',
  bgDanger: '#fdecea',
  textDanger: '#c0392b',
  borderDanger: 'rgba(192,57,43,0.3)',
  bgAccent: BTC_LIGHT,
  textAccent: BTC,
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  radius: 8,
}

export const TRIGGER_LABELS: Record<SequenceTrigger, string> = {
  signup: 'po prihlásení na newsletter',
  purchase: 'po kúpe konzultácie',
  lead_magnet: 'po stiahnutí lead magnetu',
  manual: 'manuálne pridaný kontakt',
}

export const TRIGGER_OPTIONS: SequenceTrigger[] = ['signup', 'purchase', 'lead_magnet', 'manual']

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'ai'

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  small,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: BtnVariant
  disabled?: boolean
  small?: boolean
  type?: 'button' | 'submit'
}) {
  const base: React.CSSProperties = {
    border: 'none',
    borderRadius: 8,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: small ? 12 : 13,
    padding: small ? '5px 10px' : '9px 18px',
    transition: 'opacity 0.15s',
  }
  const styles: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: disabled ? COLORS.surface0 : BTC, color: disabled ? COLORS.textMuted : '#fff' },
    ghost: { background: 'none', border: `0.5px solid ${COLORS.borderStrong}`, color: COLORS.textSecondary },
    danger: { background: COLORS.bgDanger, border: `0.5px solid ${COLORS.borderDanger}`, color: COLORS.textDanger },
    ai: { background: BTC_LIGHT, border: `0.5px solid ${BTC_BORDER}`, color: BTC },
  }
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>
      {children}
    </button>
  )
}

export const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  border: `0.5px solid ${COLORS.borderStrong}`,
  borderRadius: COLORS.radius,
  background: COLORS.surface1,
  color: COLORS.textPrimary,
  outline: 'none',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  color: COLORS.textPrimary,
}
