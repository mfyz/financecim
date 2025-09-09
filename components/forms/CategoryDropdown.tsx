'use client'

import { useState, useEffect } from 'react'

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
  uncategorizedLabel = "Uncategorized"
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

  // Format categories with tree structure
  const formatCategoryOptions = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = []
    
    // Add special options for filters
    if (includeAll) {
      options.push({ value: 'all', label: allLabel })
    }
    
    if (includeUncategorized) {
      options.push({ value: 'uncategorized', label: uncategorizedLabel })
    }
    
    if (includeEmpty) {
      options.push({ value: '', label: emptyLabel })
    }
    
    const addOptions = (cats: CategoryWithChildren[], level = 0, shouldExclude = false) => {
      cats.forEach(cat => {
        const isExcluded = shouldExclude || cat.id === excludeId
        
        if (!isExcluded) {
          let prefix = ''
          
          // Add non-breaking spaces for indentation with L-bracket and space before label
          if (level > 0) {
            prefix = '\u00A0\u00A0\u00A0\u00A0'.repeat(level) + '└ '
          }
          
          options.push({
            value: cat.id.toString(),
            label: `${prefix}${cat.name}`
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

  if (loading) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select 
          disabled 
          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
        >
          <option>Loading categories...</option>
        </select>
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
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          required={required}
        >
          {!includeEmpty && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Inline version without label
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      required={required}
    >
      {!includeEmpty && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}