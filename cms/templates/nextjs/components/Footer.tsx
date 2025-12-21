import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ 
      marginTop: '4rem', 
      paddingTop: '2rem', 
      textAlign: 'center'
    }}>
      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
        Powered by Minimalist
      </p>
      <Link 
        href="/admin" 
        style={{ 
          color: '#0070f3',
          textDecoration: 'underline'
        }}
      >
        Admin Panel
      </Link>
    </footer>
  )
}

