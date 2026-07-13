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

export type EnrollmentStatus = 'active' | 'done' | 'unsubscribed'

export interface Enrollment {
  email: string
  firstName?: string
  sequenceId: string
  enrolledAt: string // ISO
  nextEmailIndex: number // index ďalšieho emailu na odoslanie
  nextSendAt: string // ISO — kedy poslať nextEmailIndex
  status: EnrollmentStatus
}

export interface NewsletterData {
  sequences: Sequence[]
  enrollments: Enrollment[]
}

export const EMPTY_NEWSLETTER_DATA: NewsletterData = { sequences: [], enrollments: [] }
