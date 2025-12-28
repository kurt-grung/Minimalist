'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  locale?: string
  defaultLocale?: string
  className?: string
  style?: React.CSSProperties
}

export default function SearchBar({ 
  placeholder = 'Search posts and pages...',
  locale,
  defaultLocale,
  className,
  style
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const searchQuery = query.trim()
    if (searchQuery.length < 2) return
    
    const params = new URLSearchParams({ q: searchQuery })
    if (locale && locale !== defaultLocale) {
      params.append('locale', locale)
    }
    
    router.push(`/search?${params.toString()}`)
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSearch} className={className} style={style}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              paddingRight: query ? '2.5rem' : '1rem',
              fontSize: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0070f3'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '1.2rem',
                lineHeight: 1,
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 2}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: query.trim().length < 2 ? 'not-allowed' : 'pointer',
            opacity: query.trim().length < 2 ? 0.6 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          Search
        </button>
      </div>
    </form>
  )
}

