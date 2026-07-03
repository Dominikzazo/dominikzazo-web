import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kruh · Dominik Žažo',
  description: 'Tichšie miesto pre tých, čo chcú ísť hlbšie. Zaregistruj sa zadarmo.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
