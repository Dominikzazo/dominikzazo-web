import { CONFIRM_SUBJECT } from './confirm'

// Typ odoslaného mailu. Resend v zozname (/emails) NEvracia tags, takže typ
// odvodzujeme z predmetu: sekvenčné maily poznáme podľa predmetov našich
// sekvencií, týždenné podľa názvov broadcastov („Nedeľné ticho — <predmet>").
export type EmailKind = 'drip' | 'broadcast' | 'confirm' | 'other'

export interface ClassifyContext {
  sequenceSubjects: string[]
  broadcastNames: string[]
}

const TEST_PREFIX = /^\[TEST\]\s*/i

export function classifyEmail(subject: string, ctx: ClassifyContext): EmailKind {
  const s = (subject || '').trim()
  if (!s) return 'other'

  if (s === CONFIRM_SUBJECT) return 'confirm'

  // testovacie odoslanie týždenného čísla chodí s prefixom [TEST]
  const bare = s.replace(TEST_PREFIX, '').trim()

  if (ctx.sequenceSubjects.some((x) => x.trim() === bare)) return 'drip'

  // broadcast name = „Nedeľné ticho — <predmet>", predmet mailu je len tá časť za pomlčkou
  if (ctx.broadcastNames.some((n) => n.trim() === bare || n.trim().endsWith(bare))) {
    return 'broadcast'
  }

  return 'other'
}

export const KIND_LABELS: Record<EmailKind, string> = {
  drip: 'sekvencia',
  broadcast: 'Nedeľné ticho',
  confirm: 'potvrdenie',
  other: 'iné',
}
