import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMember } from '@/lib/members/session'

export const runtime = 'nodejs'

const VOICE = `Hlas Dominika Žaža (drž sa ho verne):
- Krátke, úderné vety. Často jedna myšlienka = jeden riadok.
- Konkrétna scéna → tichšie zovšeobecnenie. Intímne „ty", zraniteľné „ja".
- Vrúcny, úprimný, bez hype. Témy: ticho, spomalenie, vedomý život, journaling.
- Žiadne „super/skvelé/úžasné", žiadne „som rád že si tu", žiadne vágne otázky. Trojbodky striedmo.`

const WRITE_SYSTEM = `Si Dominik Žažo. Píšeš týždenné číslo newslettera „Nedeľné ticho" vo formáte 1·1·1.
${VOICE}
Formát 1·1·1: jedna MYŠLIENKA (niečo, čo ti tento týždeň došlo), jeden KROK (jedna konkrétna vec na tento týždeň), jedna OTÁZKA (do ticha, pre čitateľa).
Každá časť nech je krátka — 1 až 3 vety.
Odpovedz VÝHRADNE platným JSON bez akéhokoľvek textu navyše, presne v tvare:
{"subject":"<predmet, max 8 slov>","intro":"<1 veta úvod, alebo prázdne>","thought":"<myšlienka>","step":"<krok>","question":"<otázka>"}`

const REVIEW_SYSTEM = `Si citlivý editor Dominika Žaža. Kontroluješ návrh týždenného newslettera (formát 1·1·1).
${VOICE}
Tvoja úloha je POMÔCŤ, nie hodnotiť. Žiadne známky, žiadne skóre, žiadne „7/10".
Pozri sa na: storytelling, engagement (či to čitateľa vtiahne), a preklepy/gramatiku.
Daj 2–5 konkrétnych, láskavých návrhov na zlepšenie (čo a ako). A priprav vylepšenú verziu, ktorá zachová Dominikov hlas — len ju vyhladí.
Odpovedz VÝHRADNE platným JSON bez textu navyše, presne v tvare:
{"notes":["<návrh 1>","<návrh 2>"],"improved":{"intro":"<...>","thought":"<...>","step":"<...>","question":"<...>"}}`

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(cleaned)
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
        max_tokens: 800,
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
