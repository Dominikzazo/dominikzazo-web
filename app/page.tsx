import HomeClient from '@/components/HomeClient'
import { listBooks, listPlaces, getMonthly, getHomepage, getAbout } from '@/lib/cms/public'

export type SectionId = 'home' | 'maj' | 'myslienky' | 'citam' | 'cestovanie' | 'projekty' | 'o-mne'

export default async function HomePage() {
  // Obsah (knihy, mapa, mesačný edit, domov, o mne) sa načíta z CMS na serveri
  const [books, places, monthly, homepage, about] = await Promise.all([
    listBooks(),
    listPlaces(),
    getMonthly(),
    getHomepage(),
    getAbout(),
  ])
  return (
    <HomeClient
      books={books}
      places={places}
      monthly={monthly}
      homepage={homepage}
      about={about}
    />
  )
}

