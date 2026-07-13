import type { NewsletterData, Sequence, Enrollment, SequenceTrigger } from './types'

function activeSequenceFor(data: NewsletterData, trigger: SequenceTrigger): Sequence | undefined {
  return data.sequences.find((s) => s.active && s.trigger === trigger)
}

export function enroll(
  data: NewsletterData,
  email: string,
  firstName: string | undefined,
  trigger: SequenceTrigger,
  now: Date = new Date(),
): NewsletterData {
  const seq = activeSequenceFor(data, trigger)
  if (!seq || seq.emails.length === 0) return data

  const already = data.enrollments.some(
    (e) => e.email === email && e.sequenceId === seq.id && e.status === 'active',
  )
  if (already) return data

  const enrollment: Enrollment = {
    email,
    firstName,
    sequenceId: seq.id,
    enrolledAt: now.toISOString(),
    nextEmailIndex: 0,
    nextSendAt: now.toISOString(),
    status: 'active',
  }
  return { ...data, enrollments: [...data.enrollments, enrollment] }
}

export function dueEnrollments(data: NewsletterData, now: Date = new Date()): Enrollment[] {
  return data.enrollments.filter(
    (e) => e.status === 'active' && new Date(e.nextSendAt).getTime() <= now.getTime(),
  )
}

export function advance(enrollment: Enrollment, sequence: Sequence, now: Date = new Date()): Enrollment {
  const nextIndex = enrollment.nextEmailIndex + 1
  const nextEmail = sequence.emails[nextIndex]
  if (!nextEmail) {
    return { ...enrollment, nextEmailIndex: nextIndex, status: 'done' }
  }
  return {
    ...enrollment,
    nextEmailIndex: nextIndex,
    nextSendAt: new Date(now.getTime() + nextEmail.delayDays * 86400000).toISOString(),
    status: 'active',
  }
}
