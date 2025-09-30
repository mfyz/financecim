'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Confirm } from '@/components/ui/confirm'
import toast from 'react-hot-toast'

type CleanDataOption = {
  id: string
  label: string
  description: string
}

const cleanDataOptions: CleanDataOption[] = [
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Delete all transaction records',
  },
  {
    id: 'categories',
    label: 'Categories',
    description: 'Delete all categories',
  },
  {
    id: 'sources',
    label: 'Sources',
    description: 'Delete all sources',
  },
  {
    id: 'units',
    label: 'Units',
    description: 'Delete all units',
  },
  {
    id: 'unit_rules',
    label: 'Unit Rules',
    description: 'Delete all unit assignment rules',
  },
  {
    id: 'category_rules',
    label: 'Category Rules',
    description: 'Delete all category assignment rules',
  },
  {
    id: 'import_log',
    label: 'Import History',
    description: 'Delete all import logs',
  },
]

export default function SettingsPage() {
  const [expanded, setExpanded] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((opt) => opt !== id) : [...prev, id]
    )
  }

  const handleDeleteClick = () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one option to clean')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/settings/clean-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables: selectedOptions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clean data')
      }

      const result = await response.json()
      toast.success(`Successfully cleaned ${result.deletedCount} records from ${result.tables.length} table(s)`)
      setSelectedOptions([])
      setExpanded(false)
    } catch (error) {
      console.error('Error cleaning data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to clean data')
    } finally {
      setIsDeleting(false)
      setShowConfirmModal(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your application settings and data
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-500 dark:border-red-600 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Permanently delete data from your database
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            {expanded ? 'Cancel' : 'Clean Data'}
          </button>
        </div>

        {expanded && (
          <div className="space-y-4 mt-6 pt-6 border-t-2 border-red-300 dark:border-red-700">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              Select the data you want to delete:
            </p>

            <div className="space-y-2">
              {cleanDataOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleDeleteClick}
              disabled={selectedOptions.length === 0}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Delete Selected Data
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Confirm
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Selected Data?"
        message={`You are about to permanently delete data from ${selectedOptions.length} table(s). This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}