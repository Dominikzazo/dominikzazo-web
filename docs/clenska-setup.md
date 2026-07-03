# Členská sekcia — setup

Auth cez Clerk, tenko wrapnuté v `lib/members/session.ts` (`getMember()`).
Zvyšok appky volá wrapper, nie Clerk priamo → nízky vendor lock.

## Súbory (fáza 1)

| Súbor | Čo robí |
|---|---|
| `middleware.ts` | `clerkMiddleware`, chráni `/clenska/obsah` |
| `app/layout.tsx` | `<ClerkProvider>` (SK lokalizácia + gold appearance) |
| `lib/members/session.ts` | thin wrapper `getMember()` |
| `lib/members/clerkAppearance.ts` | vzhľad Clerk komponentov (cream + gold) |
| `app/clenska/page.tsx` | verejný landing (premium hero + CTA) |
| `app/sign-in`, `app/sign-up` | Clerk auth flow |
| `components/Nav.tsx` | gold pill „✦ členská" |

## Clerk app (raz, ~2 min)

1. https://dashboard.clerk.com → **Create application**
2. Name: `dominikzazo.sk`. Sign-in: zapni **Email** + **Google**.
3. **API Keys** → skopíruj `Publishable key` (pk_) a `Secret key` (sk_).
4. Vlož do `.env.local` (viď `.env.local.example`).

## Env vars

Lokálne: `.env.local` (nekomituje sa).
Vercel: Project → Settings → Environment Variables (Production + Preview).

## Deploy

Push na `main` → Vercel auto-deploy. Po deployi nastav v kroku 2 Clerk webhook
na `https://dominikzazo.sk/api/members/register-webhook`.
