import { describe, it, expect } from 'vitest'
import { normalizeData } from '../store'

describe('normalizeData', () => {
  it('fills all three arrays from an empty/missing value', () => {
    expect(normalizeData(null)).toEqual({ sequences: [], enrollments: [], events: [] })
    expect(normalizeData(undefined)).toEqual({ sequences: [], enrollments: [], events: [] })
    expect(normalizeData({})).toEqual({ sequences: [], enrollments: [], events: [] })
  })

  it('preserves existing arrays', () => {
    const seq = [{ id: 's1', name: 'X', trigger: 'signup' as const, active: true, emails: [] }]
    const out = normalizeData({ sequences: seq })
    expect(out.sequences).toBe(seq)
    expect(out.enrollments).toEqual([])
    expect(out.events).toEqual([])
  })

  it('defaults events on legacy data that predates the events field', () => {
    const out = normalizeData({ sequences: [], enrollments: [{ email: 'a@b.sk' }] })
    expect(out.events).toEqual([])
    expect(out.enrollments).toHaveLength(1)
  })
})
