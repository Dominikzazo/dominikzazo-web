import { randomUUID } from 'node:crypto'
import { readData, writeData } from './store'
import type { Book, Place, MonthlyEdit } from './types'

// CRUD nad verejným obsahom (knihy, mapa, mesačný edit).
// Číta sa z homepage (RSC), mutuje z /clenska/admin server actions.

// ── Knihy ──────────────────────────────────────────────────

export async function listBooks(): Promise<Book[]> {
  const d = await readData()
  return [...d.books].sort((a, b) => a.order - b.order)
}

export async function upsertBook(input: Omit<Book, 'id' | 'order'> & { id?: string }): Promise<void> {
  const d = await readData()
  if (input.id) {
    d.books = d.books.map((b) => (b.id === input.id ? { ...b, ...input, id: b.id } : b))
  } else {
    d.books.push({ ...input, id: randomUUID(), order: d.books.length })
  }
  await writeData(d)
}

export async function deleteBook(id: string): Promise<void> {
  const d = await readData()
  d.books = d.books.filter((b) => b.id !== id)
  await writeData(d)
}

// ── Miesta / mapa ──────────────────────────────────────────

export async function listPlaces(): Promise<Place[]> {
  const d = await readData()
  return [...d.places].sort((a, b) => a.order - b.order)
}

export async function upsertPlace(input: Omit<Place, 'id' | 'order'> & { id?: string }): Promise<void> {
  const d = await readData()
  if (input.id) {
    d.places = d.places.map((p) => (p.id === input.id ? { ...p, ...input, id: p.id } : p))
  } else {
    d.places.push({ ...input, id: randomUUID(), order: d.places.length })
  }
  await writeData(d)
}

export async function deletePlace(id: string): Promise<void> {
  const d = await readData()
  d.places = d.places.filter((p) => p.id !== id)
  await writeData(d)
}

// ── Mesačný edit ───────────────────────────────────────────

export async function getMonthly(): Promise<MonthlyEdit> {
  const d = await readData()
  return d.monthly
}

export async function updateMonthly(monthly: MonthlyEdit): Promise<void> {
  const d = await readData()
  d.monthly = monthly
  await writeData(d)
}
