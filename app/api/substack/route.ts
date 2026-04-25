import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdominikzazo.substack.com%2Ffeed&count=6',
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ items: [] })
  }
}
