'use client'

interface Category {
  id: number
  name: string
  parentCategoryId: number | null
  color: string
  icon: string | null
  monthlyBudget: number | null
  createdAt: string
  updatedAt: string
}

interface CategoryLabelProps {
  category?: Category | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean
  showColor?: boolean
  variant?: 'badge' | 'inline' | 'input'
}

export function CategoryLabel({
  category,
  size = 'md',
  className = '',
  showIcon = true,
  showColor = true,
  variant = 'badge'
}: CategoryLabelProps) {
  // Handle empty/uncategorized states
  if (!category) {
    const baseClasses = variant === 'input' 
      ? 'flex items-center px-1 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer'
      : 'text-gray-500 dark:text-gray-400'
    
    return (
      <span className={`${baseClasses} ${className}`}>
        Uncategorized
      </span>
    )
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }

  const colorDotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  // Determine text color based on background brightness
  const getTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return white text for dark colors, black for light colors
    return luminance > 0.6 ? 'text-gray-900' : 'text-white'
  }

  const textColor = showColor ? getTextColor(category.color) : 'text-gray-900 dark:text-white'
  const pillStyle = showColor ? { backgroundColor: category.color } : {}

  if (variant === 'input') {
    if (showColor) {
      return (
        <div className={`flex items-center min-h-[1.5rem] px-1 ${className}`}>
          <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${textColor}`} style={pillStyle}>
            {showIcon && category.icon && (
              <span className={`${iconSizes[size]} mr-1`}>
                {category.icon}
              </span>
            )}
            <span className="truncate">
              {category.name}
            </span>
          </div>
        </div>
      )
    } else {
      return (
        <div className={`flex items-center px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${className}`}>
          {showIcon && category.icon && (
            <span className={`${iconSizes[size]} mr-2`}>
              {category.icon}
            </span>
          )}
          <span className="truncate">
            {category.name}
          </span>
        </div>
      )
    }
  }

  if (variant === 'inline') {
    if (showColor) {
      return (
        <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${textColor} ${className}`} style={pillStyle}>
          {showIcon && category.icon && (
            <span className={`${iconSizes[size]} mr-1`}>
              {category.icon}
            </span>
          )}
          <span className="truncate">
            {category.name}
          </span>
        </div>
      )
    } else {
      return (
        <div className={`inline-flex items-center ${className}`}>
          {showIcon && category.icon && (
            <span className={`${iconSizes[size]} mr-1`}>
              {category.icon}
            </span>
          )}
          <span className="text-gray-900 dark:text-white">
            {category.name}
          </span>
        </div>
      )
    }
  }

  // Badge variant (default) - colored pill
  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${showColor ? textColor : 'text-gray-900 dark:text-white'} ${className}`} style={showColor ? pillStyle : { backgroundColor: '#f3f4f6' }}>
      {showIcon && category.icon && (
        <span className={`${iconSizes[size]} mr-1`}>
          {category.icon}
        </span>
      )}
      <span className="truncate">
        {category.name}
      </span>
    </div>
  )
}

// Simple text label for special states (All Categories, etc.)
export function CategoryTextLabel({ 
  text, 
  variant = 'badge', 
  className = '' 
}: { 
  text: string
  variant?: 'badge' | 'inline' | 'input'
  className?: string 
}) {
  if (variant === 'input') {
    return (
      <div className={`flex items-center min-h-[1.5rem] px-1 py-0.5 text-gray-500 dark:text-gray-400 ${className}`}>
        <span>{text}</span>
      </div>
    )
  }

  return (
    <span className={`text-gray-700 dark:text-gray-300 ${className}`}>
      {text}
    </span>
  )
}