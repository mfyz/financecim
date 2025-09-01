'use client'

import { Modal } from './modal'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

export type ConfirmationType = 'info' | 'warning' | 'error' | 'success'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmationType
  isLoading?: boolean
}

const typeConfig = {
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
  }
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false
}: ConfirmationDialogProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  const handleConfirm = async () => {
    if (!isLoading) {
      await onConfirm()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className={`rounded-md p-4 ${config.bgColor} ${config.borderColor} border`}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonColor}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}