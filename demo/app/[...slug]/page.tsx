import { getPostBySlug, getPageBySlug, getAllPosts, getAllPages, type Post, type Page } from '@/lib/content'
import { getConfig } from '@/lib/config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export async function generateStaticParams() {
  const config = getConfig()
  const params: { slug: string[] }[] = []

  // Add post routes
  const posts = await getAllPosts()
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  posts.forEach((post) => {
    params.push({
      slug: postRoute ? [postRoute, post.slug] : [post.slug]
    })
  })

  // Add page routes
  const pages = await getAllPages()
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''
  pages.forEach((page) => {
    params.push({
      slug: pageRoute ? [pageRoute, page.slug] : [page.slug]
    })
  })

  return params
}

export default async function DynamicContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const config = getConfig()
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const pageRoute = config.pageRoute !== undefined && config.pageRoute !== null ? config.pageRoute : ''
  
  // Await params in Next.js 16
  const resolvedParams = await params
  // Handle array of slugs
  const slugArray = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug]
  
  // Determine if this is a post or page route
  let content: Post | Page | null = null
  let contentType: 'post' | 'page' | null = null
  let actualSlug: string = ''

  if (slugArray.length === 2) {
    // Has route prefix
    const [route, slug] = slugArray
    
    // Check configured post route (only if postRoute is not empty)
    if (postRoute && route === postRoute) {
      const post = await getPostBySlug(slug)
      if (post) {
        content = post
        contentType = 'post'
        actualSlug = slug
      }
    }
    
    // Check configured page route
    if (!content && pageRoute && route === pageRoute) {
      const page = await getPageBySlug(slug)
      if (page) {
        content = page
        contentType = 'page'
        actualSlug = slug
      }
    }
    
    // Backward compatibility: also check if it's the old "posts" route
    if (!content && route === 'posts' && postRoute !== 'posts' && postRoute !== '') {
      const post = await getPostBySlug(slug)
      if (post) {
        content = post
        contentType = 'post'
        actualSlug = slug
      }
    }
  } else if (slugArray.length === 1) {
    // No route prefix - single slug at root level
    const slug = slugArray[0]
    
    // First check if postRoute is empty - if so, this could be a post
    if (!postRoute) {
      const post = await getPostBySlug(slug)
      if (post) {
        content = post
        contentType = 'post'
        actualSlug = slug
      }
    }
    
    // If not a post and pageRoute is empty, check if it's a page
    if (!content && !pageRoute) {
      const page = await getPageBySlug(slug)
      if (page) {
        content = page
        contentType = 'page'
        actualSlug = slug
      }
    }
  }

  if (!content || !contentType) {
    notFound()
  }

  // Render post
  if (contentType === 'post' && content) {
    const post = content as Post
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <Link 
          href="/"
          style={{ 
            display: 'inline-block',
            marginBottom: '2rem',
            color: '#0070f3',
            textDecoration: 'underline'
          }}
        >
          ← Back to home
        </Link>

        <article style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              {post.title}
            </h1>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              <time>{new Date(post.date).toLocaleDateString()}</time>
              {post.author && <span> • By {post.author}</span>}
            </div>
          </header>

          <div 
            style={{ 
              lineHeight: '1.8',
              fontSize: '1.1rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {post.content}
          </div>
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
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link 
        href="/"
        style={{ 
          display: 'inline-block',
          marginBottom: '2rem',
          color: '#0070f3',
          textDecoration: 'underline'
        }}
      >
        ← Back to home
      </Link>

      <article style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {page.title}
          </h1>
        </header>

        <div 
          style={{ 
            lineHeight: '1.8',
            fontSize: '1.1rem',
            whiteSpace: 'pre-wrap'
          }}
        >
          {page.content}
        </div>
      </article>
      <Footer />
    </main>
  )
}

