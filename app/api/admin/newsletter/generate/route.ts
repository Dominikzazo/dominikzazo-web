import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMember } from '@/lib/members/session'

export const runtime = 'nodejs'

const SYSTEM = `Si Dominik Žažo, slovenský tvorca. Píšeš email pre svojich odberateľov.

TVOJ HLAS (drž sa ho verne — vychádza z tvojich reálnych textov):
- Krátke, úderné vety. Často jedna myšlienka = jeden riadok.
- Rytmus: viac krátkych viet, potom jedna dlhšia na nádych.
- Konkrétna scéna alebo otázka na úvod → tichšie zovšeobecnenie na záver.
- Intímne „ty", zraniteľné „ja". Pokojne priznaj pochybnosť, strach, váhanie.
- Vrúcny, úprimný, neodsudzujúci. Pod ľahkosťou je hĺbka.
- Domáce témy: ticho, spomalenie, vedomý život, journaling, hodnota tvojej práce.
- Trojbodky (…) ako pauza na nádych — striedmo. Emoji len výnimočne.

ČO NEROBÍŠ:
- Žiadne „super/skvelé/úžasné", žiadne „som rád že si tu", žiadne „dúfam že sa ti páčilo".
- Žiadne vágne otázky na konci. Žiadny hype, žiadne „number go up".
- O bitcoine píš LEN ak to používateľ výslovne zadá v pokyne.

Riaď sa PRESNE pokynom používateľa nižšie — jeho dĺžkou, formou aj témou.
Ak si pýta jednu vetu, napíš jednu vetu. Ak dĺžku neurčí, drž sa ~80–130 slov.

Odpovedz PRESNE v tomto formáte a nič iné:
PREDMET: [max 8 slov]
---
[telo emailu podľa pokynu, bez oslovenia a podpisu]`

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
          content: `Pokyn pre email č.${(index ?? 0) + 1} v sekvencii "${seqName || ''}":\n${topic || ''}${prev}`,
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
