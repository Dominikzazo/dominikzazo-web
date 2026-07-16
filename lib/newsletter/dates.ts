// Resend vracia časy ako "2026-07-15 09:36:51.681985+00" — medzera miesto "T"
// a dvojmiestny offset "+00" miesto "+00:00". new Date() to neprečíta (NaN),
// tak si to doupraceme na platné ISO.

export function parseResendDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const iso = raw
    .replace(' ', 'T')
    .replace(/([+-]\d{2})$/, '$1:00') // "+00" → "+00:00"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatResendDate(raw: string | null | undefined): string {
  const d = parseResendDate(raw)
  if (!d) return '—'
  return d.toLocaleString('sk-SK', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
