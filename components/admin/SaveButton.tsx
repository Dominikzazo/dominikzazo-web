'use client'
import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

// Submit button pre admin formuláre (server actions):
// idle → „Ukladám…" (pulz) → „✓ Uložené" (zelený pop na 2 s) → idle.
export default function SaveButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  const wasPending = useRef(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 2000)
      wasPending.current = pending
      return () => clearTimeout(t)
    }
    wasPending.current = pending
  }, [pending])

  return (
    <button
      disabled={pending}
      className={`self-start rounded-full px-5 py-2 text-[13.5px] font-medium transition-all duration-300 ${
        saved ? 'save-pop' : ''
      } ${pending ? 'animate-pulse opacity-80' : ''}`}
      style={{
        background: saved ? '#7aaa7e' : '#c9a96e',
        color: saved ? '#fff' : '#1a1a1a',
        cursor: pending ? 'wait' : 'pointer',
      }}
    >
      {pending ? 'Ukladám…' : saved ? '✓ Uložené' : children}
    </button>
  )
}
