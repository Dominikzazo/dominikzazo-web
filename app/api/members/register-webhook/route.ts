import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail, addToResendAudience, pingDiscord } from '@/lib/members/notify'

// Clerk webhook: user.created → welcome email (Resend) + newsletter audience + Discord ping.
// Route je verejná (proxy.ts chráni len /clenska/obsah), Svix podpis overuje verifyWebhook.
export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req) // číta CLERK_WEBHOOK_SIGNING_SECRET automaticky
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { email_addresses, first_name } = evt.data
    const email = email_addresses?.[0]?.email_address ?? ''
    const firstName = first_name ?? ''

    const results = await Promise.allSettled([
      sendWelcomeEmail(email, firstName),
      addToResendAudience(email, firstName),
      pingDiscord(email, firstName),
    ])
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`members webhook task ${['email', 'audience', 'discord'][i]} failed:`, r.reason)
      }
    })
  }

  return new Response('OK', { status: 200 })
}
