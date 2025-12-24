'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}

interface SiteConfig {
  siteTitle: string
  siteSubtitle: string
  postRoute: string
  pageRoute: string
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<SiteConfig>({ siteTitle: 'My Blog', siteSubtitle: 'Welcome to our simple file-based CMS', postRoute: 'posts', pageRoute: '' })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadPosts()
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    // Verify token is still valid by checking with API
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok && response.status === 401) {
        // Token is invalid, clear it and redirect
        localStorage.removeItem('admin_token')
        router.push('/admin')
      }
    } catch (err) {
      // If settings API fails, still allow access (might be network issue)
      // But if it's a 401, we know the token is invalid
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        console.error('Failed to load posts:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin')
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadPosts()
      } else {
        alert('Failed to delete post')
      }
    } catch (err) {
      alert('Error deleting post')
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
          <Link href="/" style={{ color: '#0070f3' }}>View Site</Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Settings
          </button>
          <button
            onClick={() => setShowNewPost(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            New Post
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {showNewPost && (
        <PostEditor
          config={config}
          onClose={() => {
            setShowNewPost(false)
            loadPosts()
          }}
        />
      )}

      {editingPost && (
        <PostEditor
          post={editingPost}
          config={config}
          onClose={() => {
            setEditingPost(null)
            loadPosts()
          }}
        />
      )}

      {showSettings && (
        <SettingsEditor
          config={config}
          onClose={() => {
            setShowSettings(false)
            loadSettings()
          }}
        />
      )}

      <section>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Posts</h2>
        
        {posts.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'white', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {post.slug} • {new Date(post.date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={config.postRoute ? `/${config.postRoute}/${post.slug}` : `/${post.slug}`}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f0f0f0',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setEditingPost(post)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function PostEditor({ post, config, onClose }: { post?: Post; config: SiteConfig; onClose: () => void }) {
  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [author, setAuthor] = useState(post?.author || '')
  const [saving, setSaving] = useState(false)
  const isEditing = !!post
  const slugChanged = isEditing && slug !== post.slug
  const postRoute = config.postRoute !== undefined && config.postRoute !== null ? config.postRoute : 'posts'
  const postRouteCapitalized = postRoute ? (postRoute.charAt(0).toUpperCase() + postRoute.slice(1)) : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-')
      
      // If editing and slug changed, we need to create new and delete old
      if (isEditing && slugChanged) {
        // Create new post with new slug
        const createResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            slug: finalSlug,
            content,
            excerpt,
            author,
            date: post.date // Preserve original date
          })
        })

        if (!createResponse.ok) {
          const data = await createResponse.json()
          alert(data.error || 'Failed to create new post')
          setSaving(false)
          return
        }

        // Delete old post
        const deleteResponse = await fetch(`/api/posts/${post.slug}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!deleteResponse.ok) {
          alert('New post created but failed to delete old post. Please delete it manually.')
        }
      } else {
        // Normal update or create
        const url = isEditing ? `/api/posts/${post.slug}` : '/api/posts'
        const method = isEditing ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            slug: finalSlug,
            content,
            excerpt,
            author,
            date: isEditing ? post.date : new Date().toISOString()
          })
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || `Failed to ${isEditing ? 'update' : 'save'} post`)
          setSaving(false)
          return
        }
      }

      onClose()
    } catch (err) {
      alert(`Error ${isEditing ? 'updating' : 'saving'} post`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {isEditing ? `Edit ${postRouteCapitalized || 'Post'}` : `New ${postRouteCapitalized || 'Post'}`}
            </h2>           
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Slug {isEditing && <span style={{ color: '#999', fontSize: '0.9rem' }}>(changing slug will create a new {postRouteCapitalized || 'post'})</span>}
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <span style={{ fontWeight: '500' }}>{postRouteCapitalized || 'Post'} Route Prefix:</span>
              <span style={{ 
                background: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                {postRoute ? `/${postRoute}/` : '(root)'}
              </span>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-post-title"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: slugChanged ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white',
                cursor: 'text'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              URL will be: <span style={{ fontFamily: 'monospace', color: '#0070f3' }}>
                {postRoute ? `/${postRoute}/${slug || 'your-slug'}` : `/${slug || 'your-slug'}`}
              </span>
            </p>
            {isEditing && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: slugChanged ? '#ff9800' : '#666' }}>
                {slugChanged 
                  ? `⚠️ Changing the slug will create a new ${postRouteCapitalized || 'post'} and delete the old one.`
                  : `Note: Changing the slug will create a new ${postRouteCapitalized || 'post'} and delete the old one.`}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Excerpt
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Content *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your content..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? `Update ${postRouteCapitalized || 'Post'}` : `Save ${postRouteCapitalized || 'Post'}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SettingsEditor({ config, onClose }: { config: SiteConfig; onClose: () => void }) {
  const [siteTitle, setSiteTitle] = useState(config.siteTitle !== undefined ? config.siteTitle : 'My Blog')
  const [siteSubtitle, setSiteSubtitle] = useState(config.siteSubtitle !== undefined ? config.siteSubtitle : 'Welcome to our simple file-based CMS')
  const [postRoute, setPostRoute] = useState(config.postRoute !== undefined ? config.postRoute : 'posts')
  const [pageRoute, setPageRoute] = useState(config.pageRoute !== undefined ? config.pageRoute : '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteTitle: siteTitle.trim(),
          siteSubtitle: siteSubtitle.trim(),
          postRoute: postRoute.trim(),
          pageRoute: pageRoute.trim()
        })
      })

      if (response.ok) {
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (err) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Site Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Site Title
            </label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="My Blog"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: siteTitle !== config.siteTitle ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              The title displayed on your homepage
            </p>
            {siteTitle !== config.siteTitle && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
                ⚠️ Changing this will update the site title on the homepage.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Site Subtitle
            </label>
            <input
              type="text"
              value={siteSubtitle}
              onChange={(e) => setSiteSubtitle(e.target.value)}
              placeholder="Welcome to our simple file-based CMS"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: siteSubtitle !== config.siteSubtitle ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              The subtitle text displayed below the site title on your homepage
            </p>
            {siteSubtitle !== config.siteSubtitle && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
                ⚠️ Changing this will update the subtitle on the homepage.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Post Route Prefix
            </label>
            <input
              type="text"
              value={postRoute}
              onChange={(e) => setPostRoute(e.target.value)}
              placeholder="posts"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: postRoute !== config.postRoute ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              URL prefix for posts (e.g., "posts" = /posts/[slug], "blog" = /blog/[slug], leave empty for root)
            </p>
            {postRoute !== config.postRoute && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
                ⚠️ Changing this will update all post URLs. Existing links will need to be updated.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Page Route Prefix
            </label>
            <input
              type="text"
              value={pageRoute}
              onChange={(e) => setPageRoute(e.target.value)}
              placeholder="(empty for root)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: pageRoute !== config.pageRoute ? '2px solid #ff9800' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              URL prefix for pages (e.g., "pages" = /pages/[slug], leave empty for root)
            </p>
            {pageRoute !== config.pageRoute && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
                ⚠️ Changing this will update all page URLs. Existing links will need to be updated.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

