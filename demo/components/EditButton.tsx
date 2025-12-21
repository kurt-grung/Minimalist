'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EditButtonProps {
  slug: string
  contentType?: 'post' | 'page'
}

export default function EditButton({ slug, contentType = 'post' }: EditButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we're on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const localhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.')
      setIsLocalhost(localhost)
      
      // Only check login status on localhost
      if (localhost) {
        const token = localStorage.getItem('admin_token')
        setIsLoggedIn(!!token)
      }
    }
  }, [])

  if (!isLocalhost || !isLoggedIn) {
    return null
  }

  const handleEdit = () => {
    // Navigate to edit route (encode slug to handle spaces and special characters)
    router.push(`/admin/dashboard/edit/${encodeURIComponent(slug)}`)
  }

  return (
    <button
      onClick={handleEdit}
      style={{
        padding: '0.5rem 1rem',
        background: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        marginTop: '1rem'
      }}
    >
      Edit {contentType === 'post' ? 'Post' : 'Page'}
    </button>
  )
}

