import { describe, it, expect } from 'vitest'
import { parseResendDate } from '../dates'

describe('parseResendDate', () => {
  // Resend nevracia platné ISO: medzera miesto "T" a "+00" miesto "+00:00".
  it('parses the Resend timestamp format', () => {
    const d = parseResendDate('2026-07-15 09:36:51.681985+00')
    expect(d).not.toBeNull()
    expect(d!.toISOString()).toBe('2026-07-15T09:36:51.681Z')
  })

  it('parses a non-zero offset', () => {
    const d = parseResendDate('2026-07-15 11:36:51.000000+02')
    expect(d!.toISOString()).toBe('2026-07-15T09:36:51.000Z')
  })

  it('still parses proper ISO', () => {
    const d = parseResendDate('2026-07-15T09:36:51.681Z')
    expect(d!.toISOString()).toBe('2026-07-15T09:36:51.681Z')
  })

  it('returns null for null/empty/garbage', () => {
    expect(parseResendDate(null)).toBeNull()
    expect(parseResendDate('')).toBeNull()
    expect(parseResendDate('nonsense')).toBeNull()
  })
})
