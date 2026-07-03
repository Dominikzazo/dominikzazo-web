import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'

export const metadata = { title: 'Admin · Kruh' }

// Gating vrstva 2: middleware (proxy.ts) vynúti prihlásenie, tu vynútime admina.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const member = await getMember()
  if (!member.isAdmin) redirect('/clenska')
  return <div className="min-h-screen bg-[#fafaf8] text-[#1a1a1a]">{children}</div>
}
