import { describe, it, expect } from 'vitest'
import { recordEvent, applyBounce, engagementFor, mapResendEvent, isHardBounce } from '../engagement'
import type { NewsletterData, Sequence, Enrollment, EngagementEvent } from '../types'

const seq: Sequence = {
  id: 's1', name: 'Welcome', trigger: 'signup', active: true,
  emails: [
    { id: 'e0', subject: 'A', body: 'a', delayDays: 0 },
    { id: 'e1', subject: 'B', body: 'b', delayDays: 3 },
  ],
}

function enr(email: string, status: Enrollment['status'] = 'active'): Enrollment {
  return { email, sequenceId: 's1', enrolledAt: '', nextEmailIndex: 1, nextSendAt: '', status }
}

function data(enrollments: Enrollment[] = [], events: EngagementEvent[] = []): NewsletterData {
  return { sequences: [seq], enrollments, events }
}

const ev = (over: Partial<EngagementEvent> = {}): EngagementEvent => ({
  email: 'a@test.sk', type: 'opened', source: 'drip', ref: 's1:0', at: '2026-07-16T08:00:00Z', ...over,
})

describe('recordEvent', () => {
  it('appends the event without mutating the original data', () => {
    const before = data([], [])
    const after = recordEvent(before, ev())
    expect(after.events).toHaveLength(1)
    expect(after.events[0].type).toBe('opened')
    expect(before.events).toHaveLength(0) // immutable
  })
})

describe('applyBounce', () => {
  it('marks active enrollments of that email as bounced', () => {
    const d = applyBounce(data([enr('a@test.sk'), enr('b@test.sk')]), 'a@test.sk')
    expect(d.enrollments.find((e) => e.email === 'a@test.sk')!.status).toBe('bounced')
    expect(d.enrollments.find((e) => e.email === 'b@test.sk')!.status).toBe('active')
  })

  it('leaves already unsubscribed/done enrollments untouched', () => {
    const d = applyBounce(data([enr('a@test.sk', 'unsubscribed'), enr('c@test.sk', 'done')]), 'a@test.sk')
    expect(d.enrollments[0].status).toBe('unsubscribed')
    expect(d.enrollments[1].status).toBe('done')
  })

  it('matches email case-insensitively', () => {
    const d = applyBounce(data([enr('a@test.sk')]), 'A@Test.SK')
    expect(d.enrollments[0].status).toBe('bounced')
  })
})

describe('engagementFor', () => {
  it('reports opened/clicked only for matching email + ref', () => {
    const d = data([], [
      ev({ type: 'opened', ref: 's1:0' }),
      ev({ type: 'clicked', ref: 's1:1' }),
      ev({ type: 'opened', email: 'other@test.sk', ref: 's1:1' }),
    ])
    expect(engagementFor(d, 'a@test.sk', 's1:0')).toEqual({ opened: true, clicked: false })
    expect(engagementFor(d, 'a@test.sk', 's1:1')).toEqual({ opened: false, clicked: true })
    expect(engagementFor(d, 'a@test.sk', 's1:9')).toEqual({ opened: false, clicked: false })
  })
})

describe('mapResendEvent', () => {
  const drip = (type: string) => ({
    type,
    created_at: '2026-07-16T08:00:00Z',
    data: {
      email_id: 'abc-123',
      to: ['a@test.sk'],
      tags: [
        { name: 'source', value: 'drip' },
        { name: 'seq', value: 's1' },
        { name: 'idx', value: '2' },
      ],
    },
  })

  it('maps a drip open to an opened event with seq:idx ref', () => {
    expect(mapResendEvent(drip('email.opened'))).toEqual({
      email: 'a@test.sk', type: 'opened', source: 'drip', ref: 's1:2',
      at: '2026-07-16T08:00:00Z', resendId: 'abc-123',
    })
  })

  it('maps every known Resend type', () => {
    const cases: [string, string][] = [
      ['email.sent', 'sent'],
      ['email.delivered', 'delivered'],
      ['email.opened', 'opened'],
      ['email.clicked', 'clicked'],
      ['email.bounced', 'bounced'],
      ['email.complained', 'complained'],
    ]
    for (const [resendType, ours] of cases) {
      expect(mapResendEvent(drip(resendType))?.type).toBe(ours)
    }
  })

  it('returns null for an unknown/ignored type', () => {
    expect(mapResendEvent(drip('email.delivery_delayed'))).toBeNull()
  })

  it('maps a broadcast event using broadcast_id as ref', () => {
    const e = mapResendEvent({
      type: 'email.opened',
      created_at: '2026-07-16T08:00:00Z',
      data: { email_id: 'x', to: ['a@test.sk'], broadcast_id: 'bc-9' },
    })
    expect(e).toMatchObject({ source: 'broadcast', ref: 'bc-9', type: 'opened' })
  })

  it('returns null when there is no recipient', () => {
    expect(mapResendEvent({ type: 'email.opened', data: { to: [] } })).toBeNull()
  })

  it('lowercases the recipient email', () => {
    const e = mapResendEvent({ type: 'email.opened', data: { to: ['A@Test.SK'] } })
    expect(e?.email).toBe('a@test.sk')
  })
})

describe('isHardBounce', () => {
  it('is true for a permanent bounce', () => {
    expect(isHardBounce({ data: { bounce: { type: 'Permanent' } } })).toBe(true)
  })

  it('is false for a transient (soft) bounce', () => {
    expect(isHardBounce({ data: { bounce: { type: 'Transient' } } })).toBe(false)
  })

  // Konzervatívne: keď typ nevieme, drip NEzastavíme (radšej jeden mail navyše
  // než omylom umlčaný odberateľ).
  it('is false when the bounce type is missing or undetermined', () => {
    expect(isHardBounce({ data: { bounce: {} } })).toBe(false)
    expect(isHardBounce({ data: {} })).toBe(false)
    expect(isHardBounce({ data: { bounce: { type: 'Undetermined' } } })).toBe(false)
  })
})
