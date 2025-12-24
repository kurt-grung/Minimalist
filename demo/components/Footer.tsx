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
      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
        Powered by Headless
      </p>
      {isLocalhost && (
        <Link 
          href="/admin" 
          style={{ 
            color: '#0070f3',
            textDecoration: 'underline'
          }}
        >
          Admin Panel
        </Link>
      )}
    </footer>
  )
}

