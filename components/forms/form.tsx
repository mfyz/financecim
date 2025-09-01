'use client'

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  className?: string
}

export function Form({ children, className = '', ...props }: FormProps) {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}