'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

// Force dynamic rendering - this page uses browser-only APIs
export const dynamic = 'force-dynamic'

interface Image {
  filename: string
  url: string
  size: number
  uploadedAt: string
}

export default function MediaLibrary() {
  const router = useRouter()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; filename: string | null }>({ isOpen: false, filename: null })
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    // Check if we're on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const localhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.')
      setIsLocalhost(localhost)
      
      if (!localhost) {
        router.push('/')
        return
      }
    }
    
    checkAuth()
    loadImages()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }

    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok && response.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin')
      }
    } catch (err) {
      // Network issue, allow access
    }
  }

  const loadImages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/images')
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      } else {
        setError('Failed to load images')
      }
    } catch (err) {
      setError('Error loading images')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setError('Not authenticated')
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const newImage = await response.json()
        setImages(prev => [newImage, ...prev])
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload image')
      }
    } catch (err) {
      setError('Error uploading image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteClick = (filename: string) => {
    setDeleteModal({ isOpen: true, filename })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.filename) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/images/${encodeURIComponent(deleteModal.filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setImages(prev => prev.filter(img => img.filename !== deleteModal.filename))
        setDeleteModal({ isOpen: false, filename: null })
      } else {
        setError('Failed to delete image')
        setDeleteModal({ isOpen: false, filename: null })
      }
    } catch (err) {
      setError('Error deleting image')
      setDeleteModal({ isOpen: false, filename: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, filename: null })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isLocalhost) {
    return null
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Media Library</h1>
          <Link href="/admin/dashboard" style={{ color: '#0070f3' }}>← Back to Dashboard</Link>
        </div>
        <div>
          <label
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: uploading ? '#ccc' : '#0070f3',
              color: 'white',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c33',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Loading images...
        </div>
      ) : images.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          background: 'white', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No images yet</p>
          <p style={{ fontSize: '0.9rem' }}>Upload your first image to get started!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {images.map((image) => (
            <div
              key={image.filename}
              style={{
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ position: 'relative', paddingTop: '75%', background: '#f5f5f5' }}>
                <img
                  src={image.url}
                  alt={image.filename}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {image.filename}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.75rem' }}>
                  {formatFileSize(image.size)} • {new Date(image.uploadedAt).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyToClipboard(image.url)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="Copy URL"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDeleteClick(image.filename)}
                    style={{
                      padding: '0.5rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </main>
  )
}

