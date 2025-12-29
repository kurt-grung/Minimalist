'use client'

import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  locale?: string
  defaultLocale?: string
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  baseUrl,
  locale,
  defaultLocale 
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    const [basePath, existingQuery] = baseUrl.split('?')
    const params = new URLSearchParams(existingQuery || '')
    
    if (page === 1) {
      // Remove page parameter if going to page 1
      params.delete('page')
      const queryString = params.toString()
      return basePath + (queryString ? `?${queryString}` : '')
    }
    
    params.set('page', page.toString())
    return `${basePath}?${params.toString()}`
  }

  const getPrevUrl = () => {
    if (currentPage === 1) return null
    return getPageUrl(currentPage - 1)
  }

  const getNextUrl = () => {
    if (currentPage >= totalPages) return null
    return getPageUrl(currentPage + 1)
  }

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const prevUrl = getPrevUrl()
  const nextUrl = getNextUrl()
  const pageNumbers = getPageNumbers()

  return (
    <nav 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '3rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}
      aria-label="Pagination"
    >
      {/* Previous button */}
      {prevUrl ? (
        <Link
          href={prevUrl}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#333',
            backgroundColor: 'white',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          ← Previous
        </Link>
      ) : (
        <span
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            color: '#999',
            backgroundColor: '#f5f5f5',
            cursor: 'not-allowed'
          }}
        >
          ← Previous
        </span>
      )}

      {/* Page numbers */}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                style={{
                  padding: '0.5rem',
                  color: '#666'
                }}
              >
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <Link
              key={pageNum}
              href={getPageUrl(pageNum)}
              style={{
                padding: '0.5rem 0.75rem',
                border: `1px solid ${isActive ? '#0070f3' : '#ddd'}`,
                borderRadius: '4px',
                textDecoration: 'none',
                color: isActive ? 'white' : '#333',
                backgroundColor: isActive ? '#0070f3' : 'white',
                fontWeight: isActive ? '600' : 'normal',
                transition: 'background-color 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      {/* Next button */}
      {nextUrl ? (
        <Link
          href={nextUrl}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#333',
            backgroundColor: 'white',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          Next →
        </Link>
      ) : (
        <span
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            color: '#999',
            backgroundColor: '#f5f5f5',
            cursor: 'not-allowed'
          }}
        >
          Next →
        </span>
      )}
    </nav>
  )
}

