import { useState, useEffect } from 'react'
import { getKbCategories, getKbArticles, getKbArticle, markArticleHelpful, seedKbArticles } from '../api/client'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  display_order: number
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  view_count: number
  helpful_count: number
}

interface FullArticle extends Article {
  content: string
  category_name: string
  category_slug: string
  category_icon: string
  not_helpful_count: number
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:16px 0 8px;color:var(--k-text-primary)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:20px 0 10px;color:var(--k-text-primary)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;margin:0 0 16px;color:var(--k-text-primary)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="padding:4px 0 4px 16px;color:var(--k-text-primary)"><strong>$1.</strong> $2</div>')
    .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 16px;color:var(--k-text-secondary)">• $1</div>')
    .replace(/🟢 (.+)/g, '<span style="color:var(--k-success-text)">🟢 $1</span>')
    .replace(/🟡 (.+)/g, '<span style="color:var(--k-warning-text)">🟡 $1</span>')
    .replace(/🔴 (.+)/g, '<span style="color:var(--k-danger-text)">🔴 $1</span>')
    .replace(/\n\n/g, '<br/><br/>')
}

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<FullArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleLoading, setArticleLoading] = useState(false)
  const [helpfulSent, setHelpfulSent] = useState(false)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [seeding, setSeeding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const data = await getKbCategories()
      setCategories(data.categories)
      // Load all articles for global search
      const allArts: Article[] = []
      for (const cat of data.categories) {
        try {
          const artData = await getKbArticles(cat.slug)
          allArts.push(...artData.articles)
        } catch {}
      }
      setAllArticles(allArts)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function selectCategory(cat: Category) {
    setSelectedCategory(cat)
    setSelectedArticle(null)
    setArticles([])
    setArticlesLoading(true)
    try {
      const data = await getKbArticles(cat.slug)
      setArticles(data.articles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setArticlesLoading(false)
    }
  }

  async function selectArticle(slug: string) {
    setArticleLoading(true)
    setHelpfulSent(false)
    try {
      const data = await getKbArticle(slug)
      setSelectedArticle(data.article)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setArticleLoading(false)
    }
  }

  async function sendHelpful(helpful: boolean) {
    if (!selectedArticle || helpfulSent) return
    await markArticleHelpful(selectedArticle.slug, helpful)
    setHelpfulSent(true)
  }

  async function seed() {
    setSeeding(true)
    try {
      const result = await seedKbArticles()
      alert(result.message)
      if (selectedCategory) await selectCategory(selectedCategory)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) return (
    <div className="k-page">
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading Knowledge Base...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div className="k-page-title">📖 Knowledge Base</div>
            <div className="k-page-sub">Guides, how-tos, and methodology references</div>
          </div>
          <button className="k-btn k-btn-secondary" onClick={seed} disabled={seeding} style={{ fontSize: '12px' }}>
            {seeding ? '⏳ Seeding...' : '🌱 Seed Articles'}
          </button>
        </div>
        <input
          placeholder="🔍 Search articles..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', fontSize: '13px', padding: '8px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}
        />
      </div>

      {error && (
        <div style={{ margin: '16px 32px', background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar — Categories */}
        <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--k-border-default)', overflowY: 'auto', background: 'var(--k-bg-surface)', padding: '16px 0' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => selectCategory(cat)}
              style={{
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: selectedCategory?.id === cat.id ? 'var(--k-brand-primary)' : 'var(--k-text-secondary)',
                background: selectedCategory?.id === cat.id ? 'var(--k-brand-faint)' : 'transparent',
                borderLeft: `3px solid ${selectedCategory?.id === cat.id ? 'var(--k-brand-primary)' : 'transparent'}`,
                display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all var(--k-transition)',
              }}
            >
              <span style={{ fontSize: '16px' }}>{cat.icon}</span>
              {cat.name}
            </div>
          ))}
        </div>

       {/* Article list */}
        {!selectedArticle && (
          <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--k-border-default)', overflowY: 'auto', padding: '20px' }}>
            {searchQuery ? (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  🔍 Search results for "{searchQuery}"
                </div>
                {allArticles.filter(a =>
                  a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center', marginTop: '32px' }}>
                    No articles match "{searchQuery}"
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allArticles.filter(a =>
                      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(article => (
                      <div key={article.id} onClick={() => selectArticle(article.slug)} style={{ padding: '12px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', cursor: 'pointer' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{article.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', lineHeight: 1.5 }}>{article.excerpt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : !selectedCategory ? (
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center', marginTop: '48px' }}>
                Select a category to browse articles
              </div>
            ) : articlesLoading ? (
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>Loading articles...</div>
            ) : articles.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center', marginTop: '48px' }}>
                No articles yet. Click 🌱 Seed Articles to populate the KB.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  {selectedCategory.icon} {selectedCategory.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {articles.map(article => (
                    <div key={article.id} onClick={() => selectArticle(article.slug)} style={{ padding: '12px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{article.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', lineHeight: 1.5 }}>{article.excerpt}</div>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '8px' }}>👁 {article.view_count} views · 👍 {article.helpful_count} helpful</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Article content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {!selectedArticle && !selectedCategory && (
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>Kinalys Knowledge Base</div>
              <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Select a category from the left to get started</div>
            </div>
          )}

          {articleLoading && (
            <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading article...</div>
          )}

          {selectedArticle && !articleLoading && (
            <>
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '20px' }}>
                <span style={{ cursor: 'pointer', color: 'var(--k-brand-primary)' }} onClick={() => setSelectedArticle(null)}>
                  {selectedArticle.category_icon} {selectedArticle.category_name}
                </span>
                <span>›</span>
                <span>{selectedArticle.title}</span>
              </div>

              {/* Article */}
              <div style={{ maxWidth: '720px' }}>
                <div
                  style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--k-text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content) }}
                />

                {/* Helpful */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--k-border-default)' }}>
                  {helpfulSent ? (
                    <div style={{ fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>✓ Thanks for your feedback!</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>Was this article helpful?</span>
                      <button onClick={() => sendHelpful(true)} style={{ fontSize: '12px', padding: '4px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-success-border)', background: 'var(--k-success-bg)', color: 'var(--k-success-text)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: 600 }}>👍 Yes</button>
                      <button onClick={() => sendHelpful(false)} style={{ fontSize: '12px', padding: '4px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>👎 No</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
