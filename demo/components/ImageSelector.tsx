'use client'

import { useState, useEffect } from 'react'

interface Image {
  filename: string
  url: string
  size: number
  uploadedAt: string
}

interface ImageSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export default function ImageSelector({ isOpen, onClose, onSelect }: ImageSelectorProps) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen])

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
        // Auto-select the newly uploaded image
        onSelect(newImage.url)
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload image')
      }
    } catch (err) {
      setError('Error uploading image')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleSelect = (url: string) => {
    onSelect(url)
    onClose()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Select Image</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Upload Section */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <label
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? 'Uploading...' : 'Upload New Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {error && (
            <p style={{ color: '#dc3545', marginTop: '0.5rem', fontSize: '0.9rem' }}>{error}</p>
          )}
        </div>

        {/* Images Grid */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              Loading images...
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              No images yet. Upload your first image!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {images.map((image) => (
                <div
                  key={image.filename}
                  onClick={() => handleSelect(image.url)}
                  style={{
                    cursor: 'pointer',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    background: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0070f3'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <div style={{ position: 'relative', paddingTop: '100%', background: '#f5f5f5' }}>
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
                  <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {image.filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                      {formatFileSize(image.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External URL Option */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Or use an external image URL:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              id="external-image-url"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const url = (e.target as HTMLInputElement).value.trim()
                  if (url) {
                    handleSelect(url)
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('external-image-url') as HTMLInputElement
                const url = input.value.trim()
                if (url) {
                  handleSelect(url)
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Use URL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

