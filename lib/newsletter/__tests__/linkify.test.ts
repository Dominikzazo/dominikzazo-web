import { describe, it, expect } from 'vitest'
import { linkifyHtml, linkifyText } from '../linkify'

describe('linkifyHtml', () => {
  it('leaves plain text alone (but escapes it)', () => {
    expect(linkifyHtml('Ahoj, ako sa máš?')).toBe('Ahoj, ako sa máš?')
  })

  it('escapes HTML so a body can never inject markup', () => {
    expect(linkifyHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('turns a bare https URL into a link', () => {
    const out = linkifyHtml('Pozri https://dominikzazo.sk/kruh dnes.')
    expect(out).toContain('href="https://dominikzazo.sk/kruh"')
    expect(out).toContain('>https://dominikzazo.sk/kruh</a>')
    expect(out.startsWith('Pozri ')).toBe(true)
    expect(out.endsWith(' dnes.')).toBe(true)
  })

  it('renders a markdown link as a hyperlink on the text', () => {
    const out = linkifyHtml('[prečítaj si to tu](https://dominikzazo.sk/clanok)')
    expect(out).toContain('href="https://dominikzazo.sk/clanok"')
    expect(out).toContain('>prečítaj si to tu</a>')
    expect(out).not.toContain('[prečítaj')
  })

  it('escapes ampersands in the href so query params survive', () => {
    const out = linkifyHtml('https://dominikzazo.sk/a?x=1&y=2')
    expect(out).toContain('href="https://dominikzazo.sk/a?x=1&amp;y=2"')
  })

  it('escapes the anchor text of a markdown link', () => {
    const out = linkifyHtml('[<b>tučné</b>](https://dominikzazo.sk)')
    expect(out).toContain('&lt;b&gt;tučné&lt;/b&gt;')
    expect(out).not.toContain('<b>')
  })

  it('handles several links in one line', () => {
    const out = linkifyHtml('[a](https://a.sk) a tiež https://b.sk koniec')
    expect(out).toContain('href="https://a.sk"')
    expect(out).toContain('href="https://b.sk"')
    expect(out).toContain('koniec')
  })

  it('does not link a javascript: URL', () => {
    const out = linkifyHtml('[klik](javascript:alert(1))')
    expect(out).not.toContain('<a')
    expect(out).not.toContain('javascript:alert')
  })

  it('does not swallow a trailing sentence period into the URL', () => {
    const out = linkifyHtml('Choď na https://dominikzazo.sk.')
    expect(out).toContain('href="https://dominikzazo.sk"')
    expect(out).toContain('</a>.')
  })
})

describe('linkifyText', () => {
  it('leaves plain text alone and does not escape it', () => {
    expect(linkifyText('Ahoj <ty>')).toBe('Ahoj <ty>')
  })

  it('renders a markdown link as "text: url" for the plain-text part', () => {
    expect(linkifyText('[prečítaj tu](https://dominikzazo.sk/x)')).toBe(
      'prečítaj tu: https://dominikzazo.sk/x',
    )
  })

  it('leaves a bare URL as-is', () => {
    expect(linkifyText('Pozri https://dominikzazo.sk dnes')).toBe(
      'Pozri https://dominikzazo.sk dnes',
    )
  })
})
