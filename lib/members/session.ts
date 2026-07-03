import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Tenký wrapper nad Clerk. Zvyšok appky volá TOTO, nie Clerk priamo —
 * ak raz vymeníme auth providera, meníme len tento súbor.
 */
export interface Member {
  isAuthed: boolean
  isAdmin: boolean
  userId: string | null
  email: string | null
  firstName: string | null
}

const ANON: Member = { isAuthed: false, isAdmin: false, userId: null, email: null, firstName: null }

// Admin allowlist (emailová). Zmena = úprava env ADMIN_EMAILS (comma-separated).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'zazodominik@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function getMember(): Promise<Member> {
  const { userId } = await auth()
  if (!userId) return ANON

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null

  return {
    isAuthed: true,
    isAdmin: email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false,
    userId,
    email,
    firstName: user?.firstName ?? null,
  }
}
