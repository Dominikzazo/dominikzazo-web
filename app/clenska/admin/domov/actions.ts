'use server'

import { revalidatePath } from 'next/cache'
import { getMember } from '@/lib/members/session'
import { updateHomepage, updateAbout, getHomepage, getAbout } from '@/lib/cms/public'

async function requireAdmin() {
  const m = await getMember()
  if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')
}

function revalidate() {
  revalidatePath('/clenska/admin/domov')
  revalidatePath('/')
}

export async function saveHomepage(formData: FormData) {
  await requireAdmin()
  const current = await getHomepage()

  await updateHomepage({
    greeting: String(formData.get('greeting') ?? current.greeting).trim(),
    bio1: String(formData.get('bio1') ?? current.bio1).trim(),
    bio2: String(formData.get('bio2') ?? current.bio2).trim(),
    tagline: String(formData.get('tagline') ?? current.tagline).trim(),
    nowText: String(formData.get('nowText') ?? current.nowText).trim(),
    quoteText: String(formData.get('quoteText') ?? current.quoteText).trim(),
    quoteTags: String(formData.get('quoteTags') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    photo1Src: String(formData.get('photo1Src') ?? current.photo1Src).trim(),
    photo1Label: String(formData.get('photo1Label') ?? current.photo1Label).trim(),
    photo2Src: String(formData.get('photo2Src') ?? current.photo2Src).trim(),
    photo2Label: String(formData.get('photo2Label') ?? current.photo2Label).trim(),
  })

  revalidate()
}

export async function saveAbout(formData: FormData) {
  await requireAdmin()
  const current = await getAbout()

  // Fakty: jeden riadok = "emoji | Názov | Popis"
  const factsRaw = String(formData.get('facts') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim())
      return {
        emoji: parts[0] || '•',
        title: parts[1] || '',
        desc: parts[2] || '',
      }
    })
    .filter((f) => f.title)

  await updateAbout({
    title: String(formData.get('title') ?? current.title).trim(),
    bio1: String(formData.get('bio1') ?? current.bio1).trim(),
    bio2: String(formData.get('bio2') ?? current.bio2).trim(),
    bio3: String(formData.get('bio3') ?? current.bio3).trim(),
    bio4: String(formData.get('bio4') ?? current.bio4).trim(),
    photoSrc: String(formData.get('photoSrc') ?? current.photoSrc).trim(),
    facts: factsRaw.length > 0 ? factsRaw : current.facts,
  })

  revalidate()
}
