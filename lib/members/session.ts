import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Tenký wrapper nad Clerk. Zvyšok appky volá TOTO, nie Clerk priamo —
 * ak raz vymeníme auth providera, meníme len tento súbor.
 */
export interface Member {
  isAuthed: boolean
  userId: string | null
  email: string | null
  firstName: string | null
}

const ANON: Member = { isAuthed: false, userId: null, email: null, firstName: null }

export async function getMember(): Promise<Member> {
  const { userId } = await auth()
  if (!userId) return ANON

  const user = await currentUser()
  return {
    isAuthed: true,
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null,
    firstName: user?.firstName ?? null,
  }
}
