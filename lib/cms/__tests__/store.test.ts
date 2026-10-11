import { describe, it, expect } from 'vitest'
import { readData, SEED } from '../store'

describe('cms store', () => {
  it('returns SEED data when no storage backend is configured', async () => {
    const data = await readData()
    expect(data.books.length).toBeGreaterThan(0)
    expect(data.places.length).toBeGreaterThan(0)
    expect(data.monthly.heading).toBe(SEED.monthly.heading)
  })
})
