import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'
import WeeklyComposer from '@/components/admin/newsletter/WeeklyComposer'

export const metadata = { title: 'Týždenné číslo — admin' }

export default async function Page() {
  const m = await getMember()
  if (!m.isAdmin) redirect('/')
  return <WeeklyComposer adminEmail={m.email ?? ''} />
}
