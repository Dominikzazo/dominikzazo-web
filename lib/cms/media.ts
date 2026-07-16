// Pomocníci pre natívny prehrávač v Kruhu: z čoho sa dá spraviť <video>/<audio>
// a ktoré odkazy vieme vložiť priamo do stránky (namiesto odchodu na YouTube).

export type FileKind = 'video' | 'audio' | 'pdf' | 'other'

const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv']
const AUDIO_EXT = ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'oga', 'flac']

/** Odhadne typ média z prípony názvu súboru (content-type neukladáme). */
export function fileKind(fileName?: string): FileKind {
  if (!fileName || !fileName.includes('.')) return 'other'
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (AUDIO_EXT.includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  return 'other'
}

const YT_ID = /^[a-zA-Z0-9_-]{11}$/

function yt(id: string): string {
  // nocookie = menej trackingu, sedí to k brandu
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/** YouTube/Vimeo URL → embed URL. Inak null (necháme obyčajný odkaz). */
export function embedUrl(raw: string): string | null {
  if (!raw) return null
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return YT_ID.test(id) ? yt(id) : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = u.searchParams.get('v')
    if (v && YT_ID.test(v)) return yt(v)
    const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/)
    return m ? yt(m[1]) : null
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d+)/)
    return m ? `https://player.vimeo.com/video/${m[1]}` : null
  }

  return null
}
