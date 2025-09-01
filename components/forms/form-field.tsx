'use client'

import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
            ${error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        
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

FormField.displayName = 'FormField'