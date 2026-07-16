import { describe, it, expect, beforeAll } from 'vitest'
import { confirmToken, verifyConfirm } from '../confirm'
import { unsubToken } from '../unsubscribe'

beforeAll(() => {
  process.env.CRON_SECRET = 'test-secret'
})

const EMAIL = 'x@test.sk'
const FUTURE = Date.now() + 7 * 86400000
const PAST = Date.now() - 1000

describe('verifyConfirm', () => {
  it('accepts a valid token for the email and future expiry', () => {
    const t = confirmToken(EMAIL, FUTURE)
    expect(verifyConfirm(EMAIL, FUTURE, t)).toEqual({ ok: true, expired: false })
  })

  it('rejects a tampered token', () => {
    const t = confirmToken(EMAIL, FUTURE)
    expect(verifyConfirm(EMAIL, FUTURE, t.slice(0, -1) + '0').ok).toBe(false)
  })

  it('rejects a valid token used for a different email', () => {
    const t = confirmToken(EMAIL, FUTURE)
    expect(verifyConfirm('other@test.sk', FUTURE, t).ok).toBe(false)
  })

  it('rejects a valid token whose expiry has passed', () => {
    const t = confirmToken(EMAIL, PAST)
    expect(verifyConfirm(EMAIL, PAST, t)).toEqual({ ok: false, expired: true })
  })

  it('rejects if expiry is tampered to extend it', () => {
    const t = confirmToken(EMAIL, FUTURE)
    // attacker keeps token but changes x to a later time
    expect(verifyConfirm(EMAIL, FUTURE + 86400000, t).ok).toBe(false)
  })

  it('does not accept an unsubscribe token as a confirm token (purpose separation)', () => {
    const u = unsubToken(EMAIL)
    expect(verifyConfirm(EMAIL, FUTURE, u).ok).toBe(false)
  })
})
