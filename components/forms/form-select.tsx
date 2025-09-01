'use client'

import { forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, hint, required, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
              ${error 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              }
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
              appearance-none pr-10
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        
        {error && (
          <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {hint && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'