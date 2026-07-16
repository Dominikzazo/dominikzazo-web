'use client'
import { useState } from 'react'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, website }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('ok')
      } else {
        setStatus('error')
        setMsg(data.error || 'Niečo sa pokazilo.')
      }
    } catch {
      setStatus('error')
      setMsg('Niečo sa pokazilo. Skús to znova.')
    }
  }

  if (status === 'ok') {
    return (
      <div className="py-5">
        <p className="m-0 font-lora text-[19px] text-[#1a1a1a]">Skoro! Skontroluj schránku. 🤍</p>
        <p className="mt-1.5 text-[14px] text-[#666]">Poslal som ti potvrdzovací mail — klikni v ňom a si dnu.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 w-full max-w-[420px]">
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Meno"
        autoComplete="given-name"
        style={inputStyle}
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tvoj@email.sk"
        autoComplete="email"
        style={inputStyle}
      />
      {/* honeypot — skryté pred ľuďmi, boti ho vyplnia */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        aria-hidden="true"
      />
      <button type="submit" disabled={status === 'loading'} style={btnStyle}>
        {status === 'loading' ? 'Prihlasujem…' : 'Prihlásiť sa'}
      </button>
      {status === 'error' && <p className="m-0 text-[13px] text-[#c0392b]">{msg}</p>}
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 15,
  borderRadius: 10,
  border: '1px solid #e0dcd6',
  background: '#fff',
  color: '#1a1a1a',
  outline: 'none',
}
const btnStyle: React.CSSProperties = {
  padding: '12px 18px',
  fontSize: 15,
  fontWeight: 500,
  borderRadius: 10,
  border: 'none',
  background: '#F7931A',
  color: '#fff',
  cursor: 'pointer',
}
