'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Pause, Layers } from 'lucide-react'
import { Modal, Confirm } from '@/components/ui'
import { Form, FormField, FormTextarea } from '@/components/forms'
import { Unit } from '@/db/schema'
import { toast } from 'react-hot-toast'

interface NewUnitForm {
  name: string
  description: string
  color: string
  icon: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [newUnit, setNewUnit] = useState<NewUnitForm>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '💼'
  })
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingUnitId, setDeletingUnitId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch units from API
  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      const result = await response.json()
      
      if (result.success) {
        setUnits(result.data)
      } else {
        toast.error('Failed to fetch units')
      }
    } catch (error) {
      toast.error('Error loading units')
      console.error('Error fetching units:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load units on component mount
  useEffect(() => {
    fetchUnits()
  }, [])

  const resetNewUnit = () => {
    setNewUnit({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '💼'
    })
  }

  const addUnit = async () => {
    if (!newUnit.name.trim()) {
      toast.error('Unit name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUnit),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUnits(prev => [...prev, result.data])
        setShowAddModal(false)
        resetNewUnit()
        toast.success('Unit created successfully')
      } else {
        toast.error(result.message || 'Failed to create unit')
      }
    } catch (error) {
      toast.error('Error creating unit')
      console.error('Error creating unit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const editUnit = async () => {
    if (!editingUnit) return

    if (!editingUnit.name.trim()) {
      toast.error('Unit name is required')
      return
    }

    setSubmitting(true)
    try {
      const { id, ...updateData } = editingUnit
      const cleanData = { ...updateData }
      delete (cleanData as Record<string, unknown>).createdAt
      delete (cleanData as Record<string, unknown>).updatedAt
      
      const response = await fetch(`/api/units/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUnits(prev => prev.map(u => 
          u.id === editingUnit.id ? result.data : u
        ))
        setShowEditModal(false)
        setEditingUnit(null)
        toast.success('Unit updated successfully')
      } else {
        toast.error(result.message || 'Failed to update unit')
      }
    } catch (error) {
      toast.error('Error updating unit')
      console.error('Error updating unit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (unitId: number) => {
    setDeletingUnitId(unitId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUnitId) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/units/${deletingUnitId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUnits(prev => prev.filter(u => u.id !== deletingUnitId))
        toast.success('Unit deleted successfully')
        setShowDeleteConfirm(false)
        setDeletingUnitId(null)
      } else {
        toast.error(result.message || 'Failed to delete unit')
        setShowDeleteConfirm(false)
        setDeletingUnitId(null)
      }
    } catch (error) {
      toast.error('Error deleting unit')
      console.error('Error deleting unit:', error)
      setShowDeleteConfirm(false)
      setDeletingUnitId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeletingUnitId(null)
    setIsDeleting(false)
  }

  const toggleUnitStatus = async (unitId: number) => {
    try {
      const response = await fetch(`/api/units/${unitId}/toggle`, {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUnits(prev => prev.map(u => 
          u.id === unitId ? result.data : u
        ))
        toast.success(result.message)
      } else {
        toast.error(result.message || 'Failed to toggle unit status')
      }
    } catch (error) {
      toast.error('Error toggling unit status')
      console.error('Error toggling unit status:', error)
    }
  }

  const getIconComponent = (iconName: string | null) => {
    const IconComponent = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
      <div className={`${className} flex items-center justify-center text-base`} style={style}>
        {iconName || '💼'}
      </div>
    )
    IconComponent.displayName = 'IconComponent'
    return IconComponent
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>
                    <div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="flex space-x-1">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Units</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your business units and expense categories</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => {
          const IconComponent = getIconComponent(unit.icon)
          return (
            <div 
              key={unit.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 border-l-4"
              style={{ borderLeftColor: unit.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${unit.color}20` }}
                  >
                    <IconComponent 
                      className="w-5 h-5 flex items-center justify-center text-sm"
                      style={{ color: unit.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{unit.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{unit.description || ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      unit.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {unit.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: unit.color }}
                    ></div>
                    <span>{unit.color}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => toggleUnitStatus(unit.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      title={unit.active ? 'Deactivate unit' : 'Activate unit'}
                    >
                      {unit.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingUnit({ ...unit })
                        setShowEditModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      title="Edit unit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(unit.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {units.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No units found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first business unit.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Add Unit
          </button>
        </div>
      )}

      {/* Add Unit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetNewUnit()
        }}
        title="Add New Unit"
        size="sm"
      >
        <Form>
          <FormField
            label="Name"
            required
            value={newUnit.name}
            onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Marketing Agency"
          />
          
          <FormTextarea
            label="Description"
            value={newUnit.description}
            onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            placeholder="Brief description of this unit"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={newUnit.color}
                onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
              />
              <input 
                type="text" 
                value={newUnit.color}
                onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Icon (emoji or symbol)
            </label>
            <input
              type="text"
              value={newUnit.icon}
              onChange={(e) => {
                // Get the input value
                const value = e.target.value
                // Use Array.from to properly handle emojis (multi-byte characters)
                // Allow empty string or take first character
                const firstChar = value === '' ? '' : (Array.from(value)[0] || '')
                setNewUnit(prev => ({ ...prev, icon: firstChar }))
              }}
              placeholder="💼"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-center text-2xl"
              style={{ maxWidth: '100px' }}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddModal(false)
                resetNewUnit()
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={addUnit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
            >
              {submitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {submitting ? 'Creating...' : 'Add Unit'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUnit(null)
        }}
        title="Edit Unit"
        size="sm"
      >
        {editingUnit && (
          <Form>
            <FormField
              label="Name"
              required
              value={editingUnit.name}
              onChange={(e) => setEditingUnit(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            
            <FormTextarea
              label="Description"
              value={editingUnit.description || ''}
              onChange={(e) => setEditingUnit(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={2}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={editingUnit.color}
                  onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-12 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
                />
                <input 
                  type="text" 
                  value={editingUnit.color}
                  onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon (emoji or symbol)
              </label>
              <input
                type="text"
                value={editingUnit.icon || ''}
                onChange={(e) => {
                  // Get the input value
                  const value = e.target.value
                  // Use Array.from to properly handle emojis (multi-byte characters)
                  // Allow empty string or take first character
                  const firstChar = value === '' ? '' : (Array.from(value)[0] || '')
                  setEditingUnit(prev => prev ? { ...prev, icon: firstChar } : null)
                }}
                placeholder="💼"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-center text-2xl"
                style={{ maxWidth: '100px' }}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUnit(null)
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={editUnit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {submitting ? 'Saving...' : 'Save Changes'}
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
        title="Delete Unit"
        message={`Are you sure you want to delete this unit? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}