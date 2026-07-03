import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/members/session'

export const metadata = { title: 'Prihlásenie · Dominik Žažo' }

export default async function SignInPage() {
  const member = await getMember()
  if (member.isAuthed) redirect('/clenska/obsah')

  return (
    <main className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-4 py-16">
      <Link
        href="/clenska"
        className="mb-8 text-[13px] text-[#888] hover:text-[#1a1a1a] transition-colors no-underline"
      >
        ← kruh
      </Link>
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/clenska/obsah"
      />
    </main>
  )
}
