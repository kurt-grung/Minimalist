import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { getConfig } from '@/lib/config'
import Footer from '@/components/Footer'

export default async function Home() {
  const posts = await getAllPosts()
  const config = getConfig()
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const siteTitle = config.siteTitle || 'My Blog'
  const siteSubtitle = config.siteSubtitle || 'Welcome to our simple file-based CMS'

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{siteTitle}</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          {siteSubtitle}
        </p>
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
                href={postRoute ? `/${postRoute}/${post.slug}` : `/${post.slug}`}
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
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    {post.excerpt}
                  </p>
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

