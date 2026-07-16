// Dátový model newsletter systému. `next` na SequenceEmail je pripravené
// na vetvenie (fáza 2) — teraz vždy undefined = lineárny drip.

export type SequenceTrigger = 'signup' | 'purchase' | 'lead_magnet' | 'manual'

export interface SequenceEmail {
  id: string
  subject: string
  body: string // plain text s \n odriadkovaniami
  delayDays: number // dni po predošlom emaily; email #0 má 0 (odíde hneď)
  imageUrl?: string // voliteľný obrázok (Vercel Blob URL)
  next?: unknown // rezerva pre podmienky/vetvenie (fáza 2)
}

export interface Sequence {
  id: string
  name: string
  trigger: SequenceTrigger
  active: boolean
  emails: SequenceEmail[]
}

export type EnrollmentStatus = 'active' | 'done' | 'unsubscribed' | 'bounced'

export interface Enrollment {
  email: string
  firstName?: string
  sequenceId: string
  enrolledAt: string // ISO
  nextEmailIndex: number // index ďalšieho emailu na odoslanie
  nextSendAt: string // ISO — kedy poslať nextEmailIndex
  status: EnrollmentStatus
  consentAt?: string // ISO — kedy potvrdil double opt-in (GDPR dôkaz)
  consentIp?: string // IP z potvrdzovacieho requestu (GDPR dôkaz)
}

// Engagement event log — append-only. Zvláda drip aj broadcast; základ pre
// fázu 2 (vetvenie podľa open/click). Napĺňa ho Resend webhook (Deploy 2).
export type EngagementType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'

export interface EngagementEvent {
  email: string
  type: EngagementType
  source: 'drip' | 'broadcast'
  ref?: string // drip: `${sequenceId}:${emailIndex}` · broadcast: broadcastId
  at: string // ISO
  resendId?: string // Resend data.email_id (dedup/debug)
}

export interface NewsletterData {
  sequences: Sequence[]
  enrollments: Enrollment[]
  events: EngagementEvent[]
}

export const EMPTY_NEWSLETTER_DATA: NewsletterData = {
  sequences: [],
  enrollments: [],
  events: [],
}
