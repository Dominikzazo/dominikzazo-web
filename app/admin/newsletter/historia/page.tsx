import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import Historia from '@/components/admin/newsletter/Historia'

export const metadata: Metadata = { title: 'História — newsletter admin' }

export default async function HistoriaPage() {
  const m = await getMember()
  if (!m.isAdmin) redirect('/')

  return <Historia />
}
