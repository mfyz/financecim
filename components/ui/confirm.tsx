'use client'

import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { Modal } from './modal'

export type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isLoading?: boolean
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-500',
    iconBgColor: 'bg-red-100 dark:bg-red-900/30',
    confirmButtonColor: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    confirmButtonColor: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    iconBgColor: 'bg-green-100 dark:bg-green-900/30',
    confirmButtonColor: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
    confirmButtonColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  },
}

export function Confirm({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center" data-testid="confirm-modal-content">
          {/* Icon */}
          <div 
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${config.iconBgColor} mb-4`}
            data-testid="confirm-icon"
          >
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h3 
            className="text-lg font-medium text-gray-900 dark:text-white mb-2"
            data-testid="confirm-title"
          >
            {title}
          </h3>

          {/* Message */}
          <p 
            className="text-sm text-gray-600 dark:text-gray-400 mb-6"
            data-testid="confirm-message"
          >
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              data-testid="confirm-cancel-button"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center cursor-pointer ${config.confirmButtonColor}`}
              data-testid="confirm-confirm-button"
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    data-testid="confirm-loading-spinner"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
    </Modal>
  )
}