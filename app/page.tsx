import HomeClient from '@/components/HomeClient'
import { listBooks, listPlaces, getMonthly } from '@/lib/cms/public'

export type SectionId = 'home' | 'maj' | 'myslienky' | 'citam' | 'cestovanie' | 'projekty' | 'o-mne'

export default async function HomePage() {
  // Obsah (knihy, mapa, mesačný edit) sa načíta z CMS na serveri
  const [books, places, monthly] = await Promise.all([listBooks(), listPlaces(), getMonthly()])
  return <HomeClient books={books} places={places} monthly={monthly} />
}
