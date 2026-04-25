import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        lora: ['var(--font-lora)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        caveat: ['var(--font-caveat)', 'cursive'],
      },
      colors: {
        cream: '#fafaf8',
        sage: '#7aaa7e',
        'sage-dark': '#5a9a5e',
        amber: '#c9a96e',
        ink: '#1a1a1a',
      },
    },
  },
  plugins: [],
}

export default config
