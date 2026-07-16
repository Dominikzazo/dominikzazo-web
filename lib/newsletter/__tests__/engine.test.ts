import { describe, it, expect } from 'vitest'
import { enroll, dueEnrollments, advance } from '../engine'
import type { NewsletterData, Sequence } from '../types'

const seq: Sequence = {
  id: 's1', name: 'Welcome', trigger: 'signup', active: true,
  emails: [
    { id: 'e0', subject: 'A', body: 'a', delayDays: 0 },
    { id: 'e1', subject: 'B', body: 'b', delayDays: 3 },
  ],
}

function baseData(): NewsletterData {
  return { sequences: [seq], enrollments: [] }
}

describe('enroll', () => {
  it('adds an active enrollment at index 0, due now, for matching trigger', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const d = enroll(baseData(), 'x@test.sk', 'X', 'signup', now)
    expect(d.enrollments).toHaveLength(1)
    const e = d.enrollments[0]
    expect(e).toMatchObject({ email: 'x@test.sk', sequenceId: 's1', nextEmailIndex: 0, status: 'active' })
    expect(new Date(e.nextSendAt).getTime()).toBe(now.getTime())
  })

  it('is idempotent — does not double-enroll same email in same active sequence', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    let d = enroll(baseData(), 'x@test.sk', 'X', 'signup', now)
    d = enroll(d, 'x@test.sk', 'X', 'signup', now)
    expect(d.enrollments).toHaveLength(1)
  })

  it('does nothing if no active sequence for trigger', () => {
    const data: NewsletterData = { sequences: [{ ...seq, active: false }], enrollments: [] }
    const d = enroll(data, 'x@test.sk', 'X', 'signup', new Date())
    expect(d.enrollments).toHaveLength(0)
  })

  it('records consent metadata (at + ip) when provided', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const d = enroll(baseData(), 'x@test.sk', 'X', 'signup', now, {
      at: '2026-07-14T08:00:00.000Z',
      ip: '1.2.3.4',
    })
    expect(d.enrollments[0]).toMatchObject({
      consentAt: '2026-07-14T08:00:00.000Z',
      consentIp: '1.2.3.4',
    })
  })

  it('leaves consent fields undefined when no consent is passed (back-compat)', () => {
    const d = enroll(baseData(), 'x@test.sk', 'X', 'signup', new Date())
    expect(d.enrollments[0].consentAt).toBeUndefined()
    expect(d.enrollments[0].consentIp).toBeUndefined()
  })
})

describe('dueEnrollments', () => {
  it('returns only active enrollments whose nextSendAt <= now', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const data: NewsletterData = {
      sequences: [seq],
      enrollments: [
        { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '2026-07-14T07:00:00Z', status: 'active' },
        { email: 'b@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 1, nextSendAt: '2026-07-20T07:00:00Z', status: 'active' },
        { email: 'c@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '2026-07-14T07:00:00Z', status: 'done' },
      ],
    }
    const due = dueEnrollments(data, now)
    expect(due.map(e => e.email)).toEqual(['a@test.sk'])
  })
})

describe('advance', () => {
  it('moves to next email and schedules by delayDays, aligned to start of that UTC day', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const e = { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 0, nextSendAt: '', status: 'active' as const }
    const next = advance(e, seq, now)
    expect(next.nextEmailIndex).toBe(1)
    expect(next.status).toBe('active')
    // now + 3 dní = 2026-07-17T08:00Z, zarovnané na 2026-07-17T00:00Z
    expect(next.nextSendAt).toBe('2026-07-17T00:00:00.000Z')
  })

  it('marks done after last email', () => {
    const now = new Date('2026-07-14T08:00:00Z')
    const e = { email: 'a@test.sk', sequenceId: 's1', enrolledAt: '', nextEmailIndex: 1, nextSendAt: '', status: 'active' as const }
    const next = advance(e, seq, now)
    expect(next.nextEmailIndex).toBe(2)
    expect(next.status).toBe('done')
  })
})
