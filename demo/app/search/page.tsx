'use client'

// Force dynamic rendering - this page uses browser-only APIs (useSearchParams, useRouter)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import LocaleSelector from '@/components/LocaleSelector'
import SafeHtml from '@/components/SafeHtml'
import PostImagePreview from '@/components/PostImagePreview'

interface SearchResult {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date?: string
  author?: string
  type: 'post' | 'page'
  locale?: string
  relevance: number
}

interface SearchResponse {
  results: SearchResult[]
  query: string
  total: number
}

// Extract first image URL from HTML or Markdown content
function extractFirstImage(content: string): string | null {
  if (!content) return null
  
  const htmlImgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (htmlImgMatch) {
    return htmlImgMatch[1]
  }
  
  const markdownImgMatch = content.match(/!\[.*?\]\(([^)]+)\)/)
  if (markdownImgMatch) {
    return markdownImgMatch[1]
  }
  
  return null
}

// Highlight search terms in text
function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const queryWords = query.split(/\s+/).filter(w => w.length > 1)
  if (queryWords.length === 0) return text
  
  let highlighted = text
  for (const word of queryWords) {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark>$1</mark>')
  }
  
  return highlighted
}

// Strip HTML and get excerpt
function getExcerpt(html: string, maxLength: number = 150): string {
  if (!html) return ''
  
  // Strip HTML tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [locale, setLocale] = useState<string>('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Redirect to home if no search query
    const initialQuery = searchParams.get('q')
    if (!initialQuery || initialQuery.trim().length < 2) {
      router.push('/')
      return
    }
    
    // Load config
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setConfig(data)
        const urlLocale = searchParams.get('locale') || data.defaultLocale || 'en'
        setLocale(urlLocale)
      })
      .catch(err => console.error('Failed to load config:', err))
    
    // Perform initial search if query exists
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery, searchParams.get('locale') || undefined)
    }
  }, [searchParams, router])

  const performSearch = async (searchQuery: string, searchLocale?: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery.trim() })
      if (searchLocale) {
        params.append('locale', searchLocale)
      }
      
      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setResults(data.results)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const searchQuery = query.trim()
    if (searchQuery.length < 2) return
    
    const params = new URLSearchParams({ q: searchQuery })
    if (locale && locale !== config?.defaultLocale) {
      params.append('locale', locale)
    }
    
    router.push(`/search?${params.toString()}`)
    performSearch(searchQuery, locale !== config?.defaultLocale ? locale : undefined)
  }

  const postRoute = config?.postRoute !== undefined && config?.postRoute !== null ? config.postRoute : 'posts'
  const siteTitle = config?.siteTitle || 'My Blog'

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                {siteTitle}
              </Link>
            </h1>
          </div>
          {config && (
            <LocaleSelector 
              locales={config.locales || []} 
              currentLocale={locale}
              defaultLocale={config.defaultLocale || 'en'}
            />
          )}
        </div>
      </header>

      <section>
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts and pages..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  paddingRight: query ? '2.5rem' : '1rem',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0070f3'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || query.trim().length < 2 ? 'not-allowed' : 'pointer',
                opacity: loading || query.trim().length < 2 ? 0.6 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>Searching...</p>
          </div>
        ) : query.trim().length < 2 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>Enter at least 2 characters to search</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>No results found for &quot;{query}&quot;</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </p>
            <div 
              className="search-results"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {results.map((result) => {
                const imageUrl = extractFirstImage(result.content || '')
                const excerpt = result.excerpt 
                  ? getExcerpt(result.excerpt, 150)
                  : getExcerpt(result.content, 150)
                const highlightedExcerpt = highlightText(excerpt, query)
                const highlightedTitle = highlightText(result.title, query)
                
                const href = result.type === 'post'
                  ? (postRoute 
                      ? (result.locale && result.locale !== config?.defaultLocale 
                          ? `/${result.locale}/${postRoute}/${result.slug}` 
                          : `/${postRoute}/${result.slug}`)
                      : (result.locale && result.locale !== config?.defaultLocale 
                          ? `/${result.locale}/${result.slug}` 
                          : `/${result.slug}`))
                  : (result.locale && result.locale !== config?.defaultLocale 
                      ? `/${result.locale}/${result.slug}` 
                      : `/${result.slug}`)
                
                return (
                  <Link
                    key={`${result.type}-${result.id}-${result.locale || 'default'}`}
                    href={href}
                    className="search-result-card"
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: 0,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      textDecoration: 'none',
                      color: 'inherit',
                      overflow: 'hidden',
                      height: '280px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <PostImagePreview
                      src={imageUrl || ''}
                      alt={result.title}
                      height={280}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      background: imageUrl 
                        ? 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                        : 'none'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.4rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: result.type === 'post' ? '#0070f3' : '#666',
                          color: 'white',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {result.type}
                        </span>
                        {result.date && (
                          <time style={{ 
                            color: imageUrl ? 'rgba(255,255,255,0.8)' : '#999', 
                            fontSize: '0.85rem'
                          }}>
                            {new Date(result.date).toLocaleDateString()}
                          </time>
                        )}
                      </div>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        marginBottom: '0.4rem',
                        fontWeight: '600',
                        lineHeight: '1.3',
                        color: imageUrl ? 'white' : '#333'
                      }}>
                        <SafeHtml 
                          html={highlightedTitle}
                          style={{ margin: 0 }}
                        />
                      </h3>
                      {excerpt && (
                        <SafeHtml 
                          html={highlightedExcerpt}
                          style={{ 
                            color: imageUrl ? 'rgba(255,255,255,0.9)' : '#666', 
                            marginBottom: '0.5rem',
                            fontSize: '0.8rem',
                            lineHeight: '1.4',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        />
                      )}
                      {result.author && (
                        <p style={{ 
                          color: imageUrl ? 'rgba(255,255,255,0.8)' : '#999',
                          fontSize: '0.8rem',
                          marginTop: 'auto'
                        }}>
                          By {result.author}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <Footer />
      
      <style jsx>{`
        mark {
          background-color: #ffeb3b;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>Loading search...</p>
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

