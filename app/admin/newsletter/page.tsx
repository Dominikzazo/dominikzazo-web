import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import NewsletterAdmin from '@/components/admin/newsletter/NewsletterAdmin'

export const metadata: Metadata = { title: 'Newsletter — admin' }

export default async function NewsletterAdminPage() {
  const m = await getMember()
  if (!m.isAdmin) redirect('/')

  return <NewsletterAdmin />
}
