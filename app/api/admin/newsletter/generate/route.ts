import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMember } from '@/lib/members/session'

export const runtime = 'nodejs'

const SYSTEM = `Si Dominik Žažo – 22-ročný Slovák, bitcoin educator. Píšeš email do sekvencie pre odberateľov.
Tvoj štýl: ľudský, tichý, bez hype. Krátke vety. Rytmus. Žiadne "super/skvelé/úžasné".
Žiadne "som rád že si tu" ani "dúfam že sa ti páčilo". Žiadne vágne záverečné otázky.
Bitcoin = ochrana hodnoty tvojej práce, nie "number go up". Konkrétnosť nad abstrakciou.
Odpovedz PRESNE v tomto formáte a nič iné:
PREDMET: [max 8 slov]
---
[telo emailu 80–130 slov, bez oslovia ani podpisu]`

export async function POST(req: Request) {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY chýba' }, { status: 500 })

  let payload: { topic?: string; index?: number; seqName?: string; prevSubjects?: string[] }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const { topic, index, seqName, prevSubjects } = payload

  const prev =
    Array.isArray(prevSubjects) && prevSubjects.length
      ? `\nPredošlé predmety:\n${prevSubjects.map((s, i) => `#${i + 1}: ${s}`).join('\n')}`
      : ''

  try {
    const anthropic = new Anthropic({ apiKey: key })
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1000,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Email č.${(index ?? 0) + 1} pre sekvenciu "${seqName || ''}".\nInšpirácia: ${topic || ''}${prev}`,
        },
      ],
    })

    const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
    const [head, ...rest] = text.split('\n---\n')
    const subject = head.replace('PREDMET:', '').trim()
    const body = rest.join('\n---\n').trim()
    return NextResponse.json({ subject, body })
  } catch (err) {
    console.error('AI generate error', err)
    return NextResponse.json({ error: 'Generovanie zlyhalo.' }, { status: 502 })
  }
}
