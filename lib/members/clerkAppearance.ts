/**
 * Vzhľad Clerk komponentov (SignIn/SignUp) naladený na dominikzazo.sk —
 * cream pozadie, gold/amber akcent, Lora nadpisy, Inter text.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#c9a96e',
    colorText: '#1a1a1a',
    colorTextSecondary: '#666',
    colorBackground: '#fafaf8',
    colorInputBackground: '#ffffff',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), sans-serif',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'mx-auto',
    card: 'shadow-[0_10px_50px_rgba(0,0,0,0.08)] border border-black/[0.06]',
    headerTitle: 'font-lora text-[#1a1a1a]',
    headerSubtitle: 'text-[#666]',
    socialButtonsBlockButton: 'border-black/10',
    formButtonPrimary:
      'bg-[#c9a96e] hover:bg-[#b8985d] text-[#1a1a1a] font-medium normal-case tracking-normal shadow-none',
    footerActionLink: 'text-[#5a9a5e] hover:text-[#4a8a4e]',
    logoBox: 'hidden',
  },
}
