'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label?: string
  onCopy?: () => void
  style?: React.CSSProperties
}

export default function CopyButton({ text, label, onCopy, style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      if (onCopy) {
        onCopy()
      }
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '0.25rem 0.5rem',
        background: copied ? '#28a745' : '#f0f0f0',
        color: copied ? 'white' : '#333',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        ...style
      }}
      title={copied ? 'Copied!' : `Copy ${label || 'text'}`}
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

