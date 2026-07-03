'use server'

import { revalidatePath } from 'next/cache'
import { getMember } from '@/lib/members/session'
import { updateMonthly } from '@/lib/cms/public'

export async function saveMonthly(formData: FormData) {
  const m = await getMember()
  if (!m.isAdmin) throw new Error('Nedostatočné oprávnenie')

  // Zámery: jeden riadok = "emoji | text"
  const intentions = String(formData.get('intentions') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      if (sep === -1) return { emoji: '•', text: line }
      return { emoji: line.slice(0, sep).trim() || '•', text: line.slice(sep + 1).trim() }
    })

  await updateMonthly({
    label: String(formData.get('label') ?? '').trim(),
    heading: String(formData.get('heading') ?? '').trim(),
    subtitle: String(formData.get('subtitle') ?? '').trim(),
    mainTitle: String(formData.get('mainTitle') ?? '').trim(),
    mainText: String(formData.get('mainText') ?? '').trim(),
    intentions,
    quote: String(formData.get('quote') ?? '').trim(),
  })

  revalidatePath('/clenska/admin/mesacny')
  revalidatePath('/')
}
