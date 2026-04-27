'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import type { SectionId } from '@/app/page'

interface Post {
  title: string
  link: string
  pubDate: string
  preview: string
  content: string
  cover: string | null
}

const formatDate = (s: string) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PostDetail({ post, onBack }: { post: Post; onBack: () => void }) {
  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto', padding: '110px 20px 80px' }}>
      <button
        onClick={onBack}
        style={{ border: 'none', background: 'transparent', color: '#aaa', fontSize: 13, cursor: 'pointer', marginBottom: 32, fontFamily: 'var(--font-inter), sans-serif', padding: 0 }}
      >
        ← späť na všetky myšlienky
      </button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tag bg="#ff6719" color="#fff">substack</Tag>
        <span style={{ fontSize: 13, color: '#bbb', fontFamily: 'var(--font-inter), sans-serif' }}>
          {formatDate(post.pubDate)}
        </span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 36, fontWeight: 500, color: '#1a1a1a', marginBottom: 32, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        {post.title}
      </h1>

      {post.cover && (
        <img
          src={post.cover}
          alt={post.title}
          style={{ width: '100%', height: 'auto', borderRadius: 18, marginBottom: 36, display: 'block', boxShadow: '0 6px 32px rgba(0,0,0,0.10)' }}
        />
      )}

      <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      {post.link && (
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #ebebea', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <p style={{ fontSize: 14, color: '#888', fontFamily: 'var(--font-lora), serif', fontStyle: 'italic' }}>
            Páči sa ti? Pokračuj na Substacku, kde sa dá komentovať a sledovať. 🧡
          </p>
          <a
            href={post.link}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ff6719', borderRadius: 99, padding: '12px 26px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', color: '#fff', textDecoration: 'none', fontWeight: 500 }}
          >
            ✍️ Otvoriť na Substack ↗
          </a>
        </div>
      )}
    </div>
  )
}

export default function Myslienky({ go: _ }: { go: (id: SectionId) => void }) {
  const [sel, setSel] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/substack')
      .then(r => r.json())
      .then(d => {
        if (d.items && Array.isArray(d.items)) setPosts(d.items)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (sel) return <PostDetail post={sel} onBack={() => setSel(null)} />

  return (
    <div className="page-enter page-pad" style={{ maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 52, fontWeight: 400, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
        myšlienky.
      </h2>
      <p style={{ color: '#aaa', fontSize: 15, marginBottom: 56, fontFamily: 'var(--font-inter), sans-serif' }}>
        Reflexie zo Substacku. Pomaly. Zámerne. Ľudsky. ✍️
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#bbb', fontSize: 14, fontFamily: 'var(--font-lora), serif', fontStyle: 'italic' }}>
          načítavam zo Substacku... ☕
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa', fontSize: 14 }}>
          Nepodarilo sa načítať články. <a href="https://dominikzazo.substack.com" target="_blank" rel="noreferrer" style={{ color: '#ff6719' }}>Pozri priamo na Substacku ↗</a>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa', fontSize: 14 }}>
          Zatiaľ tu nič nie je. Čoskoro sa to zmení. 🌱
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.map((p, i) => (
          <Card key={i} onClick={() => setSel(p)} style={{ padding: 0, overflow: 'hidden' }}>
            {p.cover && (
              <img
                src={p.cover}
                alt={p.title}
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              />
            )}
            <div style={{ padding: '22px 26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <Tag bg="#ff6719" color="#fff">substack</Tag>
                <span style={{ fontSize: 12, color: '#ccc', fontFamily: 'var(--font-inter), sans-serif' }}>
                  {formatDate(p.pubDate)}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.3 }}>
                {p.title}
              </h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>
                {p.preview}{p.preview.length >= 180 ? '...' : ''}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {!loading && posts.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a
            href="https://dominikzazo.substack.com"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #e0e0dc', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontFamily: 'var(--font-inter), sans-serif', color: '#444', textDecoration: 'none' }}
          >
            všetky články na Substack ↗
          </a>
        </div>
      )}
    </div>
  )
}
