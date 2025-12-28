import { getPostBySlug, getPageBySlug, getAllPosts, getAllPages, getTagBySlug, getCategoryBySlug, type Post, type Page } from '@/lib/content'
import { getConfig } from '@/lib/config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import EditButton from '@/components/EditButton'
import LocaleSelector from '@/components/LocaleSelector'
import SafeHtml from '@/components/SafeHtml'

export async function generateStaticParams() {
  const config = getConfig()
  const params: { slug: string[] }[] = []

  // Add post routes from all enabled locales with locale prefix
  const enabledLocales = config.locales?.filter(l => l.enabled) || []
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  
  for (const locale of enabledLocales) {
    const posts = await getAllPosts(locale.code, false, false) // Only published posts
    posts.forEach((post) => {
      // Format: [locale, postRoute?, slug] or [locale, slug]
      if (postRoute) {
        params.push({
          slug: [locale.code, postRoute, post.slug]
        })
      } else {
        params.push({
          slug: [locale.code, post.slug]
        })
      }
      // Also add without locale for backward compatibility (default locale only)
      if (locale.code === config.defaultLocale) {
        if (postRoute) {
          params.push({
            slug: [postRoute, post.slug]
          })
        } else {
          params.push({
            slug: [post.slug]
          })
        }
      }
    })
  }

  // Add page routes from all enabled locales with locale prefix
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''
  for (const locale of enabledLocales) {
    const pages = await getAllPages(locale.code)
    pages.forEach((page) => {
      if (pageRoute) {
        params.push({
          slug: [locale.code, pageRoute, page.slug]
        })
      } else {
        params.push({
          slug: [locale.code, page.slug]
        })
      }
      // Also add without locale for backward compatibility (default locale only)
      if (locale.code === config.defaultLocale) {
        if (pageRoute) {
          params.push({
            slug: [pageRoute, page.slug]
          })
        } else {
          params.push({
            slug: [page.slug]
          })
        }
      }
    })
  }

  return params
}

  // Helper function to find content across locales
async function findContentBySlug(
  slug: string,
  type: 'post' | 'page',
  config: ReturnType<typeof getConfig>,
  preferredLocale?: string,
  preview: boolean = false
): Promise<{ content: Post | Page | null; locale: string | null }> {
  const enabledLocales = config.locales?.filter(l => l.enabled) || []
  const defaultLocale = config.defaultLocale || 'en'
  
  // Try preferred locale first (from URL parameter)
  if (preferredLocale && enabledLocales.some(l => l.code === preferredLocale)) {
    let content: Post | Page | null = null
    if (type === 'post') {
      content = await getPostBySlug(slug, preferredLocale)
    } else {
      content = await getPageBySlug(slug, preferredLocale)
    }
    if (content) {
      // For posts, check status unless preview mode
      if (type === 'post' && !preview) {
        const post = content as Post
        const status = post.status || 'published'
        if (status === 'draft') {
          content = null // Don't show drafts unless preview
        } else if (status === 'scheduled') {
          const scheduledDate = post.scheduledDate || post.date
          if (new Date(scheduledDate) > new Date()) {
            content = null // Don't show scheduled posts before their date
          }
        }
      }
      if (content) {
        return { content, locale: preferredLocale }
      }
    }
  }
  
  // Try default locale
  let content: Post | Page | null = null
  if (type === 'post') {
    content = await getPostBySlug(slug, defaultLocale)
  } else {
    content = await getPageBySlug(slug, defaultLocale)
  }
  if (content) {
    // For posts, check status unless preview mode
    if (type === 'post' && !preview) {
      const post = content as Post
      const status = post.status || 'published'
      if (status === 'draft') {
        content = null
      } else if (status === 'scheduled') {
        const scheduledDate = post.scheduledDate || post.date
        if (new Date(scheduledDate) > new Date()) {
          content = null
        }
      }
    }
    if (content) {
      return { content, locale: defaultLocale }
    }
  }
  
  // Try other enabled locales
  for (const locale of enabledLocales) {
    if (locale.code === defaultLocale || locale.code === preferredLocale) continue // Already tried
    
    if (type === 'post') {
      content = await getPostBySlug(slug, locale.code)
    } else {
      content = await getPageBySlug(slug, locale.code)
    }
    if (content) {
      // For posts, check status unless preview mode
      if (type === 'post' && !preview) {
        const post = content as Post
        const status = post.status || 'published'
        if (status === 'draft') {
          content = null
        } else if (status === 'scheduled') {
          const scheduledDate = post.scheduledDate || post.date
          if (new Date(scheduledDate) > new Date()) {
            content = null
          }
        }
      }
      if (content) {
        return { content, locale: locale.code }
      }
    }
  }
  
  // Fallback to legacy format (no locale)
  if (type === 'post') {
    content = await getPostBySlug(slug)
  } else {
    content = await getPageBySlug(slug)
  }
  
  // For posts, check status unless preview mode
  if (content && type === 'post' && !preview) {
    const post = content as Post
    const status = post.status || 'published'
    if (status === 'draft') {
      content = null
    } else if (status === 'scheduled') {
      const scheduledDate = post.scheduledDate || post.date
      if (new Date(scheduledDate) > new Date()) {
        content = null
      }
    }
  }
  
  return { content, locale: null }
}

export default async function DynamicContentPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string[] }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const config = getConfig()
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''
  const enabledLocales = config.locales?.filter(l => l.enabled).map(l => l.code) || []
  
  // Await params in Next.js 16
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const preview = resolvedSearchParams.preview === 'true'
  
  // Handle array of slugs
  const slugArray = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug]
  
  // Determine if this is a post or page route
  let content: Post | Page | null = null
  let contentType: 'post' | 'page' | null = null
  let actualSlug: string = ''
  let foundLocale: string | null = null
  let detectedLocale: string | null = null

  // Check if first segment is a locale
  if (slugArray.length > 0 && enabledLocales.includes(slugArray[0])) {
    detectedLocale = slugArray[0]
    slugArray.shift() // Remove locale from array
    
    // If after removing locale, array is empty, this is a locale-only path (homepage for that locale)
    if (slugArray.length === 0) {
      const locale = detectedLocale
      const posts = await getAllPosts(locale, false, false) // Only published posts
      const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
      const siteTitle = config.siteTitle || 'My Blog'
      const siteSubtitle = config.siteSubtitle || 'Welcome to our simple file-based CMS'
      
      return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <header style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{siteTitle}</h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>
                  {siteSubtitle}
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
            <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Latest Posts</h2>
            
            {posts.length === 0 ? (
              <div style={{ 
                padding: '2rem', 
                background: 'white', 
                borderRadius: '8px',
                textAlign: 'center',
                color: '#666'
              }}>
                <p>No posts yet. Create your first post in the admin panel!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {posts.map((post) => (
                  <Link 
                    key={post.id} 
                    href={postRoute 
                      ? (locale !== config.defaultLocale ? `/${locale}/${postRoute}/${post.slug}` : `/${postRoute}/${post.slug}`)
                      : (locale !== config.defaultLocale ? `/${locale}/${post.slug}` : `/${post.slug}`)
                    }
                    className="post-card"
                    style={{
                      display: 'block',
                      padding: '2rem',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <SafeHtml 
                        html={post.excerpt}
                        style={{ color: '#666', marginBottom: '0.5rem' }}
                      />
                    )}
                    <time style={{ color: '#999', fontSize: '0.9rem' }}>
                      {new Date(post.date).toLocaleDateString()}
                    </time>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Footer />
        </main>
      )
    }
  }

  // Now process the remaining segments
  if (slugArray.length === 2) {
    // Has route prefix: [route, slug]
    const [route, slug] = slugArray
    
    // Check configured post route (only if postRoute is not empty)
    if (postRoute && route === postRoute) {
      const result = await findContentBySlug(slug, 'post', config, detectedLocale || undefined, preview)
      if (result.content) {
        content = result.content as Post
        contentType = 'post'
        actualSlug = slug
        foundLocale = result.locale
      }
    }
    
    // Check configured page route
    if (!content && pageRoute && route === pageRoute) {
      const result = await findContentBySlug(slug, 'page', config, detectedLocale || undefined)
      if (result.content) {
        content = result.content as Page
        contentType = 'page'
        actualSlug = slug
        foundLocale = result.locale
      }
    }
    
    // Backward compatibility: also check if it's the old "posts" route
    if (!content && route === 'posts' && postRoute !== 'posts' && postRoute !== '') {
      const result = await findContentBySlug(slug, 'post', config, detectedLocale || undefined, preview)
      if (result.content) {
        content = result.content as Post
        contentType = 'post'
        actualSlug = slug
        foundLocale = result.locale
      }
    }
  } else if (slugArray.length === 1) {
    // No route prefix - single slug at root level
    const slug = slugArray[0]
    
    // First check if postRoute is empty - if so, this could be a post
    if (!postRoute) {
      const result = await findContentBySlug(slug, 'post', config, detectedLocale || undefined, preview)
      if (result.content) {
        content = result.content as Post
        contentType = 'post'
        actualSlug = slug
        foundLocale = result.locale
      }
    }
    
    // If not a post and pageRoute is empty, check if it's a page
    if (!content && !pageRoute) {
      const result = await findContentBySlug(slug, 'page', config, detectedLocale || undefined)
      if (result.content) {
        content = result.content as Page
        contentType = 'page'
        actualSlug = slug
        foundLocale = result.locale
      }
    }
  }

  if (!content || !contentType) {
    notFound()
  }

  // Render post
  if (contentType === 'post' && content) {
    const post = content as Post
    const postStatus = post.status || 'published'
    const displayLocale = foundLocale || detectedLocale || config.defaultLocale || 'en'
    const homeUrl = displayLocale !== config.defaultLocale ? `/${displayLocale}` : '/'
    
    // Load category and tag information
    const categories = post.categories ? await Promise.all(
      post.categories.map(slug => getCategoryBySlug(slug, displayLocale))
    ) : []
    const tags = post.tags ? await Promise.all(
      post.tags.map(slug => getTagBySlug(slug, displayLocale))
    ) : []
    
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {postStatus === 'scheduled' && post.scheduledDate && new Date(post.scheduledDate) > new Date() && (
          <div style={{
            background: '#0070f3',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            📅 SCHEDULED - This post will be published on {new Date(post.scheduledDate).toLocaleString()}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link 
            href={homeUrl}
            style={{ 
              color: '#0070f3',
              textDecoration: 'underline'
            }}
          >
            ← Back to home
          </Link>
          <LocaleSelector 
            locales={config.locales || []} 
            currentLocale={displayLocale}
            defaultLocale={config.defaultLocale || 'en'}
            currentPath={`/${actualSlug}`}
          />
        </div>

        <article style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <header style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0, flex: 1 }}>
                {post.title}
              </h1>
              <EditButton slug={actualSlug} contentType="post" />
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <time>{new Date(post.date).toLocaleDateString()}</time>
              {post.author && <span> • By {post.author}</span>}
            </div>
            
            {/* Categories */}
            {categories.filter(c => c !== null).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>Categories:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {categories.filter(c => c !== null).map((category) => (
                    <Link
                      key={category!.id}
                      href={`/category/${category!.slug}${displayLocale !== config.defaultLocale ? `?locale=${displayLocale}` : ''}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: '#0070f3',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      {category!.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {tags.filter(t => t !== null).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {tags.filter(t => t !== null).map((tag) => (
                  <Link
                    key={tag!.id}
                    href={`/tag/${tag!.slug}${displayLocale !== config.defaultLocale ? `?locale=${displayLocale}` : ''}`}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: '#28a745',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    {tag!.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {post.content && /<[^>]+>/.test(post.content) ? (
            <SafeHtml 
              html={post.content}
              className="prose prose-lg max-w-none"
              style={{ 
                lineHeight: '1.8',
                fontSize: '1.1rem'
              }}
            />
          ) : (
            <div 
              style={{ 
                lineHeight: '1.8',
                fontSize: '1.1rem',
                whiteSpace: 'pre-wrap'
              }}
            >
              {post.content}
            </div>
          )}
        </article>
        <Footer />
      </main>
    )
  }

  // Render page
  if (!content) {
    notFound()
  }
  const page = content as Page
  const displayLocale = foundLocale || detectedLocale || config.defaultLocale || 'en'
  const homeUrl = displayLocale !== config.defaultLocale ? `/${displayLocale}` : '/'
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link 
          href={homeUrl}
          style={{ 
            color: '#0070f3',
            textDecoration: 'underline'
          }}
        >
          ← Back to home
        </Link>
        <LocaleSelector 
          locales={config.locales || []} 
          currentLocale={displayLocale}
          defaultLocale={config.defaultLocale || 'en'}
          currentPath={`/${actualSlug}`}
        />
      </div>

      <article style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2.5rem', margin: 0, flex: 1 }}>
              {page.title}
            </h1>
            <EditButton slug={actualSlug} contentType="page" />
          </div>
        </header>

        {page.content && /<[^>]+>/.test(page.content) ? (
          <SafeHtml 
            html={page.content}
            className="prose prose-lg max-w-none"
            style={{ 
              lineHeight: '1.8',
              fontSize: '1.1rem'
            }}
          />
        ) : (
          <div 
            style={{ 
              lineHeight: '1.8',
              fontSize: '1.1rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {page.content}
          </div>
        )}
      </article>
      <Footer />
    </main>
  )
}

