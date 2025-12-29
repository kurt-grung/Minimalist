import Link from 'next/link'
import { getAllPosts, getCategoryBySlug, getCategoryCounts } from '@/lib/content'
import { getConfig } from '@/lib/config'
import Footer from '@/components/Footer'
import LocaleSelector from '@/components/LocaleSelector'
import SafeHtml from '@/components/SafeHtml'
import PostImagePreview from '@/components/PostImagePreview'
import Pagination from '@/components/Pagination'

// Extract first image URL from HTML or Markdown content
function extractFirstImage(content: string): string | null {
  if (!content) return null
  
  // Try HTML img tag first
  const htmlImgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (htmlImgMatch) {
    return htmlImgMatch[1]
  }
  
  // Try Markdown image syntax: ![alt](url)
  const markdownImgMatch = content.match(/!\[.*?\]\(([^)]+)\)/)
  if (markdownImgMatch) {
    return markdownImgMatch[1]
  }
  
  return null
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string; page?: string }>
}) {
  const config = getConfig()
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const locale = resolvedSearchParams.locale || config.defaultLocale || 'en'
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10) || 1
  const postsPerPage = config.postsPerPage || 12
  const categorySlug = decodeURIComponent(resolvedParams.slug)
  const category = await getCategoryBySlug(categorySlug, locale)
  
  if (!category) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1>Category not found</h1>
        <Link href="/">Back to home</Link>
      </main>
    )
  }
  
  const allPosts = await getAllPosts(locale, false, false)
  const allCategoryPosts = allPosts.filter(post => post.categories?.includes(categorySlug))
  const totalPages = Math.ceil(allCategoryPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const categoryPosts = allCategoryPosts.slice(startIndex, endIndex)
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const siteTitle = config.siteTitle || 'My Blog'

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
              ← Back to {siteTitle}
            </Link>
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Category: {category.name}</h1>
            {category.description && (
              <p style={{ fontSize: '1.2rem', color: '#666' }}>{category.description}</p>
            )}
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              {allCategoryPosts.length} {allCategoryPosts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
          <LocaleSelector 
            locales={config.locales || []} 
            currentLocale={locale}
            defaultLocale={config.defaultLocale || 'en'}
          />
        </div>
      </header>

      <section>
        {categoryPosts.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No posts in this category yet.</p>
          </div>
        ) : (
          <div 
            className="posts-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {categoryPosts.map((post) => {
              const imageUrl = extractFirstImage(post.content || '')
              return (
                <Link 
                  key={post.id} 
                  href={postRoute 
                    ? (locale !== config.defaultLocale ? `/${locale}/${postRoute}/${post.slug}` : `/${postRoute}/${post.slug}`)
                    : (locale !== config.defaultLocale ? `/${locale}/${post.slug}` : `/${post.slug}`)
                  }
                  className="post-card"
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
                >
                  <PostImagePreview
                    src={imageUrl || ''}
                    alt={post.title}
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
                    <h3 style={{ 
                      fontSize: '1.1rem', 
                      marginBottom: '0.4rem',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      color: imageUrl ? 'white' : '#333'
                    }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <SafeHtml 
                        html={post.excerpt}
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
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/category/${categorySlug}${locale !== config.defaultLocale ? `?locale=${locale}` : ''}`}
        locale={locale}
        defaultLocale={config.defaultLocale || 'en'}
      />

      <Footer />
    </main>
  )
}

