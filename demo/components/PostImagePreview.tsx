'use client'

import { useState } from 'react'

interface PostImagePreviewProps {
  src: string
  alt: string
  height?: number
}

export default function PostImagePreview({ src, alt, height = 200 }: PostImagePreviewProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: `${height}px`,
      background: src && !imageError 
        ? `url(${src}) center center / cover no-repeat`
        : 'white',
      overflow: 'hidden'
    }}>
      {src && !imageError && (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}

