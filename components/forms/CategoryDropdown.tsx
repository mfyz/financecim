'use client'

import { useState, useEffect } from 'react'
import { CustomDropdown, CategoryLabel, CategoryTextLabel } from '@/components/ui'
import type { DropdownOption } from '@/components/ui'

export interface Category {
  id: number
  name: string
  parentCategoryId: number | null
  color: string
  icon: string | null
  monthlyBudget: number | null
  createdAt: string
  updatedAt: string
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface CategoryDropdownProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  includeEmpty?: boolean
  emptyLabel?: string
  excludeId?: number
  className?: string
  required?: boolean
  includeAll?: boolean
  allLabel?: string
  includeUncategorized?: boolean
  uncategorizedLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryDropdown({
  value,
  onChange,
  label,
  placeholder = "Select category...",
  includeEmpty = true,
  emptyLabel = "None",
  excludeId,
  className = "",
  required = false,
  includeAll = false,
  allLabel = "All Categories",
  includeUncategorized = false,
  uncategorizedLabel = "Uncategorized",
  size = 'md'
}: CategoryDropdownProps) {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Format categories as dropdown options with rich data
  const formatCategoryOptions = (): DropdownOption[] => {
    const options: DropdownOption[] = []
    
    // Add special options for filters
    if (includeAll) {
      options.push({ 
        value: 'all', 
        label: allLabel, 
        isSpecial: true 
      })
    }
    
    if (includeUncategorized) {
      options.push({ 
        value: 'uncategorized', 
        label: uncategorizedLabel, 
        isSpecial: true 
      })
    }
    
    if (includeEmpty) {
      options.push({ 
        value: '', 
        label: emptyLabel, 
        isSpecial: true 
      })
    }
    
    const addOptions = (cats: CategoryWithChildren[], level = 0, shouldExclude = false) => {
      cats.forEach(cat => {
        const isExcluded = shouldExclude || cat.id === excludeId
        
        if (!isExcluded) {
          let indent = ''
          
          // Add non-breaking spaces for indentation with L-bracket and space before label
          if (level > 0) {
            indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level) + '└ '
          }
          
          options.push({
            value: cat.id.toString(),
            label: cat.name,
            category: cat,
            isSpecial: false,
            indent
          })
        }
        
        if (cat.children && cat.children.length > 0) {
          addOptions(cat.children, level + 1, isExcluded)
        }
      })
    }
    
    addOptions(categories)
    return options
  }

  const options = formatCategoryOptions()

  // Custom render functions for rich display
  const renderTrigger = (selectedOption: DropdownOption | null, _isOpen: boolean) => {
    if (!selectedOption) {
      return <CategoryTextLabel text={placeholder} variant="input" />
    }

    if (selectedOption.isSpecial) {
      return <CategoryTextLabel text={selectedOption.label} variant="input" />
    }

    return <CategoryLabel category={selectedOption.category} variant="input" size={size} />
  }

  const renderOption = (option: DropdownOption, isSelected: boolean) => {
    const baseClasses = `px-3 py-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`
    
    if (option.isSpecial) {
      return (
        <div className={baseClasses}>
          <CategoryTextLabel text={option.label} variant="inline" />
        </div>
      )
    }

    return (
      <div className={baseClasses}>
        <div className="flex items-center">
          {option.indent && (
            <span className="text-gray-400 dark:text-gray-500">
              {option.indent}
            </span>
          )}
          <CategoryLabel 
            category={option.category} 
            variant="inline" 
            size={size}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}>
          Loading categories...
        </div>
      </div>
    )
  }

  if (label) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <CustomDropdown
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          className={className}
          renderTrigger={renderTrigger}
          renderOption={renderOption}
        />
      </div>
    )
  }

  // Inline version without label
  return (
    <CustomDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      renderTrigger={renderTrigger}
      renderOption={renderOption}
    />
  )
}