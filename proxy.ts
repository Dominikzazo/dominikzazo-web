import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Chránené route členskej sekcie. Verejný landing /clenska ostáva otvorený.
const isProtected = createRouteMatcher(['/clenska/obsah(.*)', '/clenska/admin(.*)', '/clenska/media(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Vynechaj Next interné súbory a statické assety (okrem query params)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Vždy spusti pre API routes
    '/(api|trpc)(.*)',
    // Clerk handshake / auto-proxy path
    '/__clerk/:path*',
  ],
}
