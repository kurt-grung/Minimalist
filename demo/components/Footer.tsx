'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    // Check if we're on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.0.'))
    }
  }, [])

  return (
    <footer style={{ 
      marginTop: '4rem', 
      paddingTop: '2rem', 
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <Link 
          href="/feed.xml" 
          style={{ 
            color: '#0070f3',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}
        >
          RSS Feed
        </Link>
        {isLocalhost && (
          <Link 
            href="/admin" 
            style={{ 
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Admin Panel
          </Link>
        )}
      </div>
      <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
        Powered by Minimalist
      </p>
    </footer>
  )
}

