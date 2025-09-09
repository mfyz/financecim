'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Modal, Confirm } from '@/components/ui'
import { Form, FormField } from '@/components/forms'
import { CategoryDropdown } from '@/components/forms/CategoryDropdown'
import toast from 'react-hot-toast'

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

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface NewCategory {
  name: string
  parentCategoryId: number | null
  color: string
  icon: string | null
  monthlyBudget: number | null
}

// Helper function to validate and extract single emoji
const getSingleEmoji = (text: string): string => {
  if (!text) return ''
  
  // Use Array.from to properly handle multi-byte characters like emojis
  const characters = Array.from(text)
  
  // Return just the first character (which could be a multi-byte emoji)
  return characters[0] || ''
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [, setFlatCategories] = useState<Category[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: '',
    parentCategoryId: null,
    color: '#3B82F6',
    icon: null,
    monthlyBudget: null
  })

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      // Fetch both hierarchical and flat lists
      const [hierarchicalRes, flatRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/categories?flat=true')
      ])
      
      if (!hierarchicalRes.ok || !flatRes.ok) {
        throw new Error('Failed to fetch categories')
      }
      
      const hierarchicalData = await hierarchicalRes.json()
      const flatData = await flatRes.json()
      
      setCategories(hierarchicalData)
      setFlatCategories(flatData)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const resetNewCategory = () => {
    setNewCategory({
      name: '',
      parentCategoryId: null,
      color: '#3B82F6',
      icon: null,
      monthlyBudget: null
    })
  }

  const addCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }

      await fetchCategories()
      setShowAddModal(false)
      resetNewCategory()
      toast.success('Category created successfully')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
    }
  }

  const updateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategory.name,
          parentCategoryId: editingCategory.parentCategoryId,
          color: editingCategory.color,
          icon: editingCategory.icon,
          monthlyBudget: editingCategory.monthlyBudget
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category')
      }

      await fetchCategories()
      setShowEditModal(false)
      setEditingCategory(null)
      toast.success('Category updated successfully')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    }
  }

  const confirmDeleteCategory = (id: number) => {
    setCategoryToDelete(id)
    setShowDeleteConfirm(true)
  }

  const deleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/categories/${categoryToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      await fetchCategories()
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  const updateBudget = async (id: number, budget: number | null) => {
    try {
      const response = await fetch(`/api/categories/${id}/budget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget: budget })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update budget')
      }

      await fetchCategories()
      setEditingBudgetId(null)
      toast.success('Budget updated successfully')
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update budget')
    }
  }

  // Render categories with hierarchy
  const renderCategoryRow = (category: CategoryWithChildren, level: number = 0): React.JSX.Element[] => {
    const isEditingBudget = editingBudgetId === category.id
    const displayIcon = category.icon || '📁'
    
    const rows: React.JSX.Element[] = []
    
    // Add the main category row
    rows.push(
      <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center">
            {level > 0 && (
              <span className="text-gray-400 dark:text-gray-500 mr-2" style={{ marginLeft: `${(level - 1) * 24}px` }}>
                └
              </span>
            )}
            <div 
              className="w-4 h-4 rounded mr-2 flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-xl mr-2">{displayIcon}</span>
            <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {isEditingBudget ? (
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-1">$</span>
              <input
                type="number"
                defaultValue={category.monthlyBudget || ''}
                onBlur={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : null
                  updateBudget(category.id, value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value
                    updateBudget(category.id, value ? parseFloat(value) : null)
                  }
                  if (e.key === 'Escape') {
                    setEditingBudgetId(null)
                  }
                }}
                className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                min="0"
                step="1"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingBudgetId(category.id)}
              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            >
              {category.monthlyBudget ? `$${Math.round(category.monthlyBudget)}` : '-'}
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="inline-flex rounded-md shadow-sm">
            <button 
              onClick={() => {
                setEditingCategory(category)
                setShowEditModal(true)
              }}
              className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center justify-center cursor-pointer"
              title="Edit category"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => confirmDeleteCategory(category.id)}
              className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
    
    // Add child category rows
    if (category.children) {
      category.children.forEach(child => {
        rows.push(...renderCategoryRow(child, level + 1))
      })
    }
    
    return rows
  }


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading categories...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Monthly Budget
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No categories yet. Click &ldquo;Add Category&rdquo; to create your first one.
                </td>
              </tr>
            ) : (
              categories.flatMap(category => renderCategoryRow(category))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetNewCategory()
        }}
        title="Add New Category"
        size="sm"
      >
        <Form>
          <FormField
            label="Name"
            required
            value={newCategory.name}
            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Groceries"
          />
          
          <CategoryDropdown
            label="Parent Category (Optional)"
            value={newCategory.parentCategoryId?.toString() || ''}
            onChange={(value) => setNewCategory(prev => ({ 
              ...prev, 
              parentCategoryId: value ? parseInt(value) : null 
            }))}
            emptyLabel="None"
            includeEmpty={true}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={newCategory.color}
                onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700 cursor-pointer"
              />
              <input 
                type="text" 
                value={newCategory.color}
                onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
          
          <FormField
            label="Icon (Single Emoji)"
            value={newCategory.icon || ''}
            onChange={(e) => {
              // Only allow single emoji/character using proper Unicode handling
              const value = getSingleEmoji(e.target.value)
              setNewCategory(prev => ({ ...prev, icon: value || null }))
            }}
            placeholder="e.g., 🛒"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
              <input 
                type="number" 
                value={newCategory.monthlyBudget || ''}
                onChange={(e) => setNewCategory(prev => ({ 
                  ...prev, 
                  monthlyBudget: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              type="button"
              onClick={() => {
                setShowAddModal(false)
                resetNewCategory()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={addCategory}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Add Category
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingCategory(null)
        }}
        title="Edit Category"
        size="sm"
      >
        {editingCategory && (
          <Form>
            <FormField
              label="Name"
              required
              value={editingCategory.name}
              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="e.g., Groceries"
            />
            
            <CategoryDropdown
              label="Parent Category (Optional)"
              value={editingCategory.parentCategoryId?.toString() || ''}
              onChange={(value) => setEditingCategory(prev => prev ? { 
                ...prev, 
                parentCategoryId: value ? parseInt(value) : null 
              } : null)}
              emptyLabel="None"
              includeEmpty={true}
              excludeId={editingCategory.id}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={editingCategory.color}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-20 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={editingCategory.color}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            
            <FormField
              label="Icon (Single Emoji)"
              value={editingCategory.icon || ''}
              onChange={(e) => {
                // Only allow single emoji/character using proper Unicode handling
                const value = getSingleEmoji(e.target.value)
                setEditingCategory(prev => prev ? { ...prev, icon: value || null } : null)
              }}
              placeholder="e.g., 🛒"
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                <input 
                  type="number" 
                  value={editingCategory.monthlyBudget || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { 
                    ...prev, 
                    monthlyBudget: e.target.value ? parseFloat(e.target.value) : null 
                  } : null)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={updateCategory}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Update Category
              </button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Confirm
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setCategoryToDelete(null)
        }}
        onConfirm={deleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}