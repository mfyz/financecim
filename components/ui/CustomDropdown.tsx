'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category?: any // For rich category data
  isSpecial?: boolean // For "All Categories", "Uncategorized", etc.
  indent?: string // For tree hierarchy
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  renderTrigger?: (selectedOption: DropdownOption | null, isOpen: boolean) => React.ReactNode
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false,
  renderTrigger,
  renderOption
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || null

  // Define handleSelect before it's used in effects
  const handleSelect = useCallback((option: DropdownOption) => {
    onChange(option.value)
    setIsOpen(false)
    setHighlightedIndex(-1)
    triggerRef.current?.focus()
  }, [onChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          triggerRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (highlightedIndex >= 0) {
            handleSelect(options[highlightedIndex])
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, highlightedIndex, options, handleSelect])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  const handleTriggerClick = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    setHighlightedIndex(-1)
  }

  const defaultRenderTrigger = (selectedOption: DropdownOption | null, isOpen: boolean) => (
    <div className="flex items-center justify-between w-full">
      <span className={selectedOption ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </div>
  )

  const defaultRenderOption = (option: DropdownOption, isSelected: boolean) => (
    <div className={`px-3 py-2 flex items-center ${
      isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
    }`}>
      {option.indent && <span className="text-gray-400">{option.indent}</span>}
      <span>{option.label}</span>
    </div>
  )

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={`
          w-full p-1 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
          ${className}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedOption ? `Selected: ${selectedOption.label}` : placeholder}
      >
        {renderTrigger ? renderTrigger(selectedOption, isOpen) : defaultRenderTrigger(selectedOption, isOpen)}
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div ref={optionsRef} role="listbox" aria-label="Options">
            {options.map((option, index) => (
              <div
                key={option.value || index}
                role="option"
                aria-selected={option.value === value}
                className={`
                  cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                  ${index === highlightedIndex ? 'bg-gray-100 dark:bg-gray-600' : ''}
                  ${option.value === value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                `}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {renderOption ? renderOption(option, option.value === value) : defaultRenderOption(option, option.value === value)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}