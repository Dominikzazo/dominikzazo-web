import { describe, it, expect } from 'vitest'
import { fileKind, embedUrl } from '../media'

describe('fileKind', () => {
  it('detects video by extension (case-insensitive)', () => {
    expect(fileKind('rano.mp4')).toBe('video')
    expect(fileKind('Klip.MOV')).toBe('video')
    expect(fileKind('a.webm')).toBe('video')
  })

  it('detects audio by extension', () => {
    expect(fileKind('meditacia.mp3')).toBe('audio')
    expect(fileKind('hlas.m4a')).toBe('audio')
    expect(fileKind('x.WAV')).toBe('audio')
  })

  it('detects pdf', () => {
    expect(fileKind('sprievodca.pdf')).toBe('pdf')
  })

  it('falls back to other for unknown or missing names', () => {
    expect(fileKind('archiv.zip')).toBe('other')
    expect(fileKind('bez-pripony')).toBe('other')
    expect(fileKind(undefined)).toBe('other')
  })
})

describe('embedUrl', () => {
  it('embeds youtube watch links', () => {
    expect(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('embeds youtu.be short links', () => {
    expect(embedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('embeds youtube shorts and /embed/ links', () => {
    expect(embedUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(embedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('embeds vimeo links', () => {
    expect(embedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789')
  })

  it('returns null for non-embeddable or invalid urls', () => {
    expect(embedUrl('https://dominikzazo.sk/nieco')).toBeNull()
    expect(embedUrl('nezmysel')).toBeNull()
    expect(embedUrl('')).toBeNull()
  })
})
