'use client'

import { Modal } from './modal'
import { Trash2, Edit, Eye } from 'lucide-react'

export type CrudAction = 'create' | 'view' | 'edit' | 'delete'

interface CrudModalProps<T = any> {
  isOpen: boolean
  onClose: () => void
  action: CrudAction
  item?: T
  title?: string
  children?: React.ReactNode
  onSave?: (data: any) => void | Promise<void>
  onDelete?: () => void | Promise<void>
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const actionIcons = {
  create: null,
  view: Eye,
  edit: Edit,
  delete: Trash2
}

const actionTitles = {
  create: 'Create',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete'
}

export function CrudModal<T>({
  isOpen,
  onClose,
  action,
  item,
  title,
  children,
  onSave,
  onDelete,
  isLoading = false,
  size = 'md'
}: CrudModalProps<T>) {
  const Icon = actionIcons[action]
  const defaultTitle = title || `${actionTitles[action]} ${item ? 'Item' : 'New Item'}`

  const handleSave = async () => {
    if (onSave && !isLoading) {
      await onSave(item)
    }
  }

  const handleDelete = async () => {
    if (onDelete && !isLoading) {
      await onDelete()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5" />}
          <span>{defaultTitle}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Content */}
        <div>
          {children}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action === 'view' ? 'Close' : 'Cancel'}
          </button>

          {action === 'delete' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {(action === 'create' || action === 'edit') && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (action === 'create' ? 'Creating...' : 'Saving...') 
                : (action === 'create' ? 'Create' : 'Save Changes')
              }
            </button>
          )}
        </div>

        {/* Delete confirmation message */}
        {action === 'delete' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-start">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Confirm Deletion
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}