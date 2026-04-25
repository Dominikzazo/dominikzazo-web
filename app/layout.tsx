import type { Metadata } from 'next'
import { Lora, Inter, Caveat } from 'next/font/google'
import './globals.css'

const lora = Lora({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-lora',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})
const caveat = Caveat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dominik Žažo',
  description: 'Vedomý kút internetu. Pomaly. Zámerne. Ľudsky.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={`${lora.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="bg-[#fafaf8] text-[#1a1a1a] font-inter antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
