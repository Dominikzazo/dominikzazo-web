import type { NewsletterData, EngagementEvent, EngagementType } from './types'

// Engagement log — napĺňa ho Resend webhook. Append-only; fáza 2 (vetvenie)
// z neho číta cez engagementFor („otvoril email #2?").

export function recordEvent(data: NewsletterData, e: EngagementEvent): NewsletterData {
  return { ...data, events: [...data.events, e] }
}

// Hard bounce → zastav drip tomu človeku (chráni reputáciu odosielateľa).
// Nechá už odhlásené/dokončené tak, ako sú.
export function applyBounce(data: NewsletterData, email: string): NewsletterData {
  const target = email.trim().toLowerCase()
  return {
    ...data,
    enrollments: data.enrollments.map((e) =>
      e.email.trim().toLowerCase() === target && e.status === 'active'
        ? { ...e, status: 'bounced' as const }
        : e,
    ),
  }
}

export function engagementFor(
  data: NewsletterData,
  email: string,
  ref: string,
): { opened: boolean; clicked: boolean } {
  const target = email.trim().toLowerCase()
  let opened = false
  let clicked = false
  for (const e of data.events) {
    if (e.ref !== ref || e.email.trim().toLowerCase() !== target) continue
    if (e.type === 'opened') opened = true
    if (e.type === 'clicked') clicked = true
  }
  return { opened, clicked }
}

// ---------- Resend webhook payload → náš event ----------

const TYPE_MAP: Record<string, EngagementType> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

type ResendTags = { name: string; value: string }[] | Record<string, string> | undefined

interface ResendPayload {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string[]
    email?: string
    broadcast_id?: string
    tags?: ResendTags
    bounce?: { type?: string }
  }
}

// Len trvalý (Permanent) bounce zastaví drip. Pri Transient/Undetermined alebo
// chýbajúcom type sme konzervatívni — radšej mail navyše než umlčaný odberateľ.
export function isHardBounce(payload: ResendPayload): boolean {
  return (payload.data?.bounce?.type || '').toLowerCase() === 'permanent'
}

// Resend posiela tagy ako [{name,value}]; toleruj aj plain objekt.
function tagValues(tags: ResendTags): Record<string, string> {
  if (!tags) return {}
  if (Array.isArray(tags)) {
    const out: Record<string, string> = {}
    for (const t of tags) if (t?.name) out[t.name] = t.value
    return out
  }
  return tags
}

export function mapResendEvent(payload: ResendPayload): EngagementEvent | null {
  const type = TYPE_MAP[payload.type || '']
  if (!type) return null

  const d = payload.data || {}
  const email = (d.to?.[0] || d.email || '').trim().toLowerCase()
  if (!email) return null

  const tags = tagValues(d.tags)
  // Broadcast eventy nesú broadcast_id natívne; drip poznáme podľa tagov
  // (source/seq/idx), ktoré pridávame pri odoslaní. Netagovaný transakčný mail
  // (napr. potvrdzovací) spadne pod 'drip' bez ref — bounce sa aj tak zaznamená.
  const broadcastId = d.broadcast_id
  const source: EngagementEvent['source'] = broadcastId ? 'broadcast' : 'drip'
  const ref = broadcastId
    ? broadcastId
    : tags.seq && tags.idx
      ? `${tags.seq}:${tags.idx}`
      : undefined

  return {
    email,
    type,
    source,
    ...(ref ? { ref } : {}),
    at: payload.created_at || new Date().toISOString(),
    ...(d.email_id ? { resendId: d.email_id } : {}),
  }
}
