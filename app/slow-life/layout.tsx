import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pomalé ráno · Dominik Žažo',
  description: 'Ráno začína deň dozadu. Priprav sa večer, žij pomaly ráno, nájdi si ticho cez deň.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
