import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import Odberatelia from '@/components/admin/newsletter/Odberatelia'

export const metadata: Metadata = { title: 'Odberatelia — newsletter admin' }

export default async function OdberateliaPage() {
  const m = await getMember()
  if (!m.isAdmin) redirect('/')

  return <Odberatelia />
}
