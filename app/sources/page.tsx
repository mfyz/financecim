'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { Modal, Confirm } from '@/components/ui'
import { Form, FormField, FormSelect } from '@/components/forms'

interface Source {
  id: number
  name: string
  type: 'bank' | 'credit_card' | 'manual'
  createdAt: string
  updatedAt: string
}

interface NewSource {
  name: string
  type: 'bank' | 'credit_card' | 'manual'
}

interface APIResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any[]
}

const typeOptions = [
  { value: 'bank', label: 'Bank' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'manual', label: 'Manual' }
]

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [newSource, setNewSource] = useState<NewSource>({
    name: '',
    type: 'bank'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingSourceId, setDeletingSourceId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load sources on component mount
  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sources')
      const result: APIResponse<Source[]> = await response.json()
      
      if (result.success && result.data) {
        setSources(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to load sources')
      }
    } catch (error) {
      console.error('Error loading sources:', error)
      setError('Network error: Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  const resetNewSource = () => {
    setNewSource({
      name: '',
      type: 'bank'
    })
  }

  const handleAddSource = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newSource.name?.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      })

      const result: APIResponse<Source> = await response.json()

      if (result.success && result.data) {
        setSources(prev => [...prev, result.data!])
        setShowAddModal(false)
        resetNewSource()
        setError(null)
      } else {
        setError(result.error || result.message || 'Failed to create source')
      }
    } catch (error) {
      console.error('Error adding source:', error)
      setError('Network error: Failed to create source')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSource = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!editingSource || !editingSource.name?.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/sources/${editingSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSource.name,
          type: editingSource.type
        })
      })

      const result: APIResponse<Source> = await response.json()

      if (result.success && result.data) {
        setSources(prev => 
          prev.map(source => source.id === editingSource.id ? result.data! : source)
        )
        setShowEditModal(false)
        setEditingSource(null)
        setError(null)
      } else {
        setError(result.error || result.message || 'Failed to update source')
      }
    } catch (error) {
      console.error('Error updating source:', error)
      setError('Network error: Failed to update source')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setDeletingSourceId(id)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSourceId) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/sources/${deletingSourceId}`, {
        method: 'DELETE'
      })

      const result: APIResponse<void> = await response.json()

      if (result.success) {
        setSources(prev => prev.filter(source => source.id !== deletingSourceId))
        setError(null)
        setShowDeleteConfirm(false)
        setDeletingSourceId(null)
      } else {
        setError(result.error || result.message || 'Failed to delete source')
        setShowDeleteConfirm(false)
        setDeletingSourceId(null)
      }
    } catch (error) {
      console.error('Error deleting source:', error)
      setError('Network error: Failed to delete source')
      setShowDeleteConfirm(false)
      setDeletingSourceId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeletingSourceId(null)
    setIsDeleting(false)
  }

  const openEditModal = (source: Source) => {
    setEditingSource({ ...source })
    setShowEditModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTypeLabel = (type: string) => {
    return typeOptions.find(option => option.value === type)?.label || type
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'credit_card': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'manual': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sources</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your data sources</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sources...</span>
        </div>
      )}

      {/* Sources Table */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No sources found. Add your first source to get started.
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(source.type)}`}>
                          {getTypeLabel(source.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(source.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex rounded-md shadow-sm">
                          <button 
                            onClick={() => openEditModal(source)}
                            className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit source"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(source.id)}
                            className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
                            title="Delete source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetNewSource()
          setError(null)
        }}
        title="Add Source"
      >
        <Form onSubmit={handleAddSource}>
          <FormField
            label="Name"
            value={newSource.name}
            onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter source name"
            required
          />
          
          <FormSelect
            label="Type"
            value={newSource.type}
            onChange={(e) => setNewSource(prev => ({ ...prev, type: e.target.value as 'bank' | 'credit_card' | 'manual' }))}
            options={typeOptions}
            required
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                resetNewSource()
                setError(null)
              }}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newSource.name?.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Source'
              )}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Source Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingSource(null)
          setError(null)
        }}
        title="Edit Source"
      >
        {editingSource && (
          <Form onSubmit={handleEditSource}>
            <FormField
              label="Name"
              value={editingSource.name}
              onChange={(e) => setEditingSource(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
              placeholder="Enter source name"
              required
            />
            
            <FormSelect
              label="Type"
              value={editingSource.type}
              onChange={(e) => setEditingSource(prev => prev ? ({ ...prev, type: e.target.value as 'bank' | 'credit_card' | 'manual' }) : null)}
              options={typeOptions}
              required
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingSource(null)
                  setError(null)
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !editingSource.name?.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Confirm
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Source"
        message={`Are you sure you want to delete this source? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}