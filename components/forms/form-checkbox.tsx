'use client'

import { forwardRef } from 'react'
import { Check, AlertCircle } from 'lucide-react'

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  className?: string
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={`
                h-4 w-4 rounded border-gray-300 dark:border-gray-600
                text-blue-600 focus:ring-blue-500
                bg-white dark:bg-gray-700
                ${error ? 'border-red-300 dark:border-red-600' : ''}
                ${className}
              `}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3 text-sm">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                {label}
              </label>
            </div>
          )}
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

FormCheckbox.displayName = 'FormCheckbox'