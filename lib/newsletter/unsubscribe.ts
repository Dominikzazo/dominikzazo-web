import crypto from 'node:crypto'

// Podpísaný odhlasovací link — token = HMAC(email), aby sa nedalo odhlásiť
// cudziu adresu. Secret = CRON_SECRET (serverový, už nastavený).

const SITE = process.env.MEMBERS_SITE_URL || 'https://dominikzazo.sk'

function secret(): string {
  return process.env.CRON_SECRET || 'dev-secret'
}

export function unsubToken(email: string): string {
  return crypto.createHmac('sha256', secret()).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function verifyUnsub(email: string, token: string): boolean {
  const expected = unsubToken(email)
  if (!token || token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export function unsubscribeUrl(email: string): string {
  return `${SITE}/api/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`
}
