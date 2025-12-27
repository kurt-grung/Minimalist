import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { getConfig } from '@/lib/config'
import Footer from '@/components/Footer'
import LocaleSelector from '@/components/LocaleSelector'
import SafeHtml from '@/components/SafeHtml'

export default async function Home() {
  const config = getConfig()
  // Load posts from default locale for homepage
  const locale = config.defaultLocale || 'en'
  const posts = await getAllPosts(locale)
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

