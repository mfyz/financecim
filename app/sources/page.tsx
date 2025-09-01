'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Form, FormField, FormSelect } from '@/components/forms'

interface Source {
  id: number
  name: string
  type: 'bank' | 'credit_card' | 'manual'
  created: string
}

interface NewSource {
  name: string
  type: 'bank' | 'credit_card' | 'manual'
}

// Mock data matching the prototype with "Test" prefix
const initialSources: Source[] = [
  { id: 1, name: 'Test Chase Bank', type: 'bank', created: '2024-01-15' },
  { id: 2, name: 'Test Capital One', type: 'credit_card', created: '2024-01-16' },
  { id: 3, name: 'Test Manual Entry', type: 'manual', created: '2024-01-17' }
]

const typeOptions = [
  { value: 'bank', label: 'Bank' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'manual', label: 'Manual' }
]

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [newSource, setNewSource] = useState<NewSource>({
    name: '',
    type: 'bank'
  })

  const resetNewSource = () => {
    setNewSource({
      name: '',
      type: 'bank'
    })
  }

  const addSource = () => {
    if (newSource.name.trim()) {
      const newId = Math.max(...sources.map(s => s.id)) + 1
      setSources(prev => [...prev, {
        id: newId,
        name: newSource.name,
        type: newSource.type,
        created: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      }])
      setShowAddModal(false)
      resetNewSource()
    }
  }

  const editSource = () => {
    if (editingSource) {
      setSources(prev => prev.map(s => 
        s.id === editingSource.id ? { ...editingSource } : s
      ))
      setShowEditModal(false)
      setEditingSource(null)
    }
  }

  const deleteSource = (sourceId: number) => {
    if (confirm('Are you sure you want to delete this source?')) {
      setSources(prev => prev.filter(s => s.id !== sourceId))
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bank':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'credit_card':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'manual':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Sources</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </button>
      </div>

      {/* Sources Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {source.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(source.type)}`}>
                    {source.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(source.created)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button 
                      onClick={() => {
                        setEditingSource({ ...source })
                        setShowEditModal(true)
                      }}
                      className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteSource(source.id)}
                      className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Source Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetNewSource()
        }}
        title="Add New Source"
        size="sm"
      >
        <Form>
          <FormField
            label="Name"
            required
            value={newSource.name}
            onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Chase Bank"
          />
          
          <FormSelect
            label="Type"
            required
            value={newSource.type}
            onChange={(e) => setNewSource(prev => ({ ...prev, type: e.target.value as Source['type'] }))}
            options={typeOptions}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddModal(false)
                resetNewSource()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
            >
              Cancel
            </button>
            <button 
              onClick={addSource}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center"
            >
              Add Source
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
        }}
        title="Edit Source"
        size="sm"
      >
        {editingSource && (
          <Form>
            <FormField
              label="Name"
              required
              value={editingSource.name}
              onChange={(e) => setEditingSource(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            
            <FormSelect
              label="Type"
              required
              value={editingSource.type}
              onChange={(e) => setEditingSource(prev => prev ? { ...prev, type: e.target.value as Source['type'] } : null)}
              options={typeOptions}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingSource(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
              >
                Cancel
              </button>
              <button 
                onClick={editSource}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center"
              >
                Save Changes
              </button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  )
}