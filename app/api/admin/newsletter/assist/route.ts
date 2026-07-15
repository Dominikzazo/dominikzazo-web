import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMember } from '@/lib/members/session'
import { VOICE, GOOD_EXAMPLES, BAD_EXAMPLES } from '@/lib/newsletter/voice'

export const runtime = 'nodejs'

const WRITE_SYSTEM = `${VOICE}

${GOOD_EXAMPLES}

${BAD_EXAMPLES}

Píšeš týždenné číslo newslettera „Nedeľné ticho" vo formáte 1·1·1:
jedna MYŠLIENKA (niečo konkrétne, čo ti tento týždeň došlo — radšej obraz než poučka),
jeden KROK (jedna konkrétna vec na tento týždeň), jedna OTÁZKA (krátka, do ticha).
Každá časť 1–3 vety, v jeho hlase, nie ako šablóna.
Odpovedz VÝHRADNE platným JSON, nič iné, presne v tvare:
{"subject":"<predmet, max 8 slov>","intro":"<1 veta úvod, alebo prázdne>","thought":"<myšlienka>","step":"<krok>","question":"<otázka>"}`

const REVIEW_SYSTEM = `${VOICE}

${GOOD_EXAMPLES}

${BAD_EXAMPLES}

Si citlivý editor Dominika. Kontroluješ návrh týždenného newslettera (1·1·1).
Tvoja úloha je POMÔCŤ, nie hodnotiť. Žiadne známky/skóre.
Pozri: storytelling, engagement (či to vtiahne), preklepy/gramatiku.
Daj 2–5 konkrétnych, láskavých návrhov. Priprav vylepšenú verziu v JEHO hlase (len vyhlaď, nezovšeobecňuj do slop).
Odpovedz VÝHRADNE platným JSON, nič iné, presne v tvare:
{"notes":["<návrh 1>","<návrh 2>"],"improved":{"intro":"<...>","thought":"<...>","step":"<...>","question":"<...>"}}`

// Robustné vytiahnutie JSON aj keď model pridá text/```-fences okolo.
function parseJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no json')
  return JSON.parse(text.slice(start, end + 1))
}

export async function POST(req: Request) {
  const m = await getMember()
  if (!m.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY chýba' }, { status: 500 })

  let body: {
    mode?: 'write' | 'review'
    topic?: string
    issue?: { intro?: string; thought?: string; step?: string; question?: string }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: key })

  try {
    if (body.mode === 'write') {
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: WRITE_SYSTEM,
        messages: [{ role: 'user', content: `Téma / inšpirácia pre toto číslo: ${body.topic || '(vyber sám niečo v mojom duchu)'}` }],
      })
      const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
      return NextResponse.json({ issue: parseJson(text) })
    }

    if (body.mode === 'review') {
      const i = body.issue || {}
      const draft = `ÚVOD: ${i.intro || '(žiadny)'}\nMYŠLIENKA: ${i.thought || ''}\nKROK: ${i.step || ''}\nOTÁZKA: ${i.question || ''}`
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: REVIEW_SYSTEM,
        messages: [{ role: 'user', content: `Skontroluj tento návrh:\n\n${draft}` }],
      })
      const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
      return NextResponse.json(parseJson(text))
    }

    return NextResponse.json({ error: 'Neznámy režim.' }, { status: 400 })
  } catch (err) {
    console.error('assist error', err)
    return NextResponse.json({ error: 'AI zlyhalo. Skús znova.' }, { status: 502 })
  }
}
