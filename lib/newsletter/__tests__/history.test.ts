import { describe, it, expect } from 'vitest'
import { classifyEmail } from '../history'

// Resend v zozname mailov nevracia tags, takže typ odvodzujeme z predmetu:
// sekvenčné maily poznáme podľa predmetov našich sekvencií, týždenné podľa
// názvov broadcastov („Nedeľné ticho — <predmet>").
const ctx = {
  sequenceSubjects: ['Prečo som začal s bitcoinom', 'Čo od týchto emailov očakávaš?'],
  broadcastNames: [
    'Nedeľné ticho — Prvých desať minút rozhoduje o zvyšku dňa',
    'Nedeľné ticho — Keď ticho zatvára dvere miesto teba',
  ],
}

describe('classifyEmail', () => {
  it('recognises a sequence email', () => {
    expect(classifyEmail('Prečo som začal s bitcoinom', ctx)).toBe('drip')
  })

  it('recognises a weekly issue by its broadcast name suffix', () => {
    expect(classifyEmail('Prvých desať minút rozhoduje o zvyšku dňa', ctx)).toBe('broadcast')
  })

  it('recognises a [TEST] send of a weekly issue', () => {
    expect(classifyEmail('[TEST] Keď ticho zatvára dvere miesto teba', ctx)).toBe('broadcast')
  })

  it('recognises the double opt-in confirmation email', () => {
    expect(classifyEmail('Ešte jeden klik 🤍', ctx)).toBe('confirm')
  })

  it('falls back to other for anything unknown', () => {
    expect(classifyEmail('Si dnu 🤍', ctx)).toBe('other')
  })

  it('ignores surrounding whitespace', () => {
    expect(classifyEmail('  Prečo som začal s bitcoinom  ', ctx)).toBe('drip')
  })

  it('does not misclassify when there are no sequences or broadcasts', () => {
    expect(classifyEmail('Čokoľvek', { sequenceSubjects: [], broadcastNames: [] })).toBe('other')
  })
})
