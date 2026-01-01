'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  title?: string
  ariaLabel?: string
}

export default function CustomSelect({ value, onChange, options, title, ariaLabel }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={selectRef} className="relative" style={{ minWidth: 'fit-content', width: 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-xs font-medium leading-none focus:outline-none flex items-center"
        style={{
          fontFamily: 'inherit',
          textAlign: 'center'
        }}
        title={title}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{selectedOption.label}</span>
        <span className="ml-1 text-xs" style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.625rem' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
          style={{
            minWidth: '100%',
            width: 'max-content',
            maxWidth: '200px'
          }}
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                option.value === value
                  ? 'text-gray-800 dark:text-gray-200 font-semibold'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={option.value === value}
              style={{
                fontFamily: 'inherit',
                textAlign: option.value === value ? 'left' : 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: option.value === value ? 'flex-start' : 'center',
                gap: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent'
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

