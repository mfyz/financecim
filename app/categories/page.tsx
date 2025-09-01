'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Form, FormField, FormSelect } from '@/components/forms'

interface Category {
  id: number
  name: string
  parent: string | null
  color: string
  icon: string
  monthlyBudget: number
}

interface NewCategory {
  name: string
  parent: string | null
  color: string
  icon: string
  monthlyBudget: number
}

// Mock data matching the prototype with "Test" prefix
const initialCategories: Category[] = [
  { id: 1, name: 'Test Food & Dining', parent: null, color: '#10B981', icon: '🍔', monthlyBudget: 800 },
  { id: 2, name: 'Test Groceries', parent: 'Test Food & Dining', color: '#10B981', icon: '🛒', monthlyBudget: 400 },
  { id: 3, name: 'Test Restaurants', parent: 'Test Food & Dining', color: '#10B981', icon: '🍽️', monthlyBudget: 300 },
  { id: 4, name: 'Test Transportation', parent: null, color: '#3B82F6', icon: '🚗', monthlyBudget: 500 },
  { id: 5, name: 'Test Gas', parent: 'Test Transportation', color: '#3B82F6', icon: '⛽', monthlyBudget: 200 },
  { id: 6, name: 'Test Entertainment', parent: null, color: '#8B5CF6', icon: '🎮', monthlyBudget: 150 },
  { id: 7, name: 'Test Shopping', parent: null, color: '#EC4899', icon: '🛍️', monthlyBudget: 300 },
  { id: 8, name: 'Test Bills & Utilities', parent: null, color: '#EF4444', icon: '📄', monthlyBudget: 600 }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: '',
    parent: null,
    color: '#3B82F6',
    icon: '',
    monthlyBudget: 0
  })

  const resetNewCategory = () => {
    setNewCategory({
      name: '',
      parent: null,
      color: '#3B82F6',
      icon: '',
      monthlyBudget: 0
    })
  }

  const addCategory = () => {
    if (newCategory.name.trim()) {
      const newId = Math.max(...categories.map(c => c.id)) + 1
      setCategories(prev => [...prev, {
        id: newId,
        name: newCategory.name,
        parent: newCategory.parent,
        color: newCategory.color,
        icon: newCategory.icon,
        monthlyBudget: newCategory.monthlyBudget
      }])
      setShowAddModal(false)
      resetNewCategory()
    }
  }

  const editCategory = () => {
    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id ? { ...editingCategory } : c
      ))
      setShowEditModal(false)
      setEditingCategory(null)
    }
  }

  const deleteCategory = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId))
    }
  }

  const updateBudget = (categoryId: number, newBudget: number) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, monthlyBudget: newBudget } : c
    ))
  }

  const getParentCategories = () => {
    return categories.filter(c => c.parent === null)
  }

  const parentOptions = getParentCategories().map(c => ({ value: c.name, label: c.name }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Categories</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parent Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monthly Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    {category.parent && (
                      <span className="ml-6 text-gray-400 dark:text-gray-500 mr-2">└</span>
                    )}
                    <span className="mr-2">{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span className={category.parent ? '' : 'text-gray-400 dark:text-gray-500'}>
                    {category.parent || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-xs font-mono">{category.color}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input 
                      type="number" 
                      value={category.monthlyBudget} 
                      onChange={(e) => updateBudget(category.id, parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      className="w-20 bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none px-1 py-0.5 text-right"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button 
                      onClick={() => {
                        setEditingCategory({ ...category })
                        setShowEditModal(true)
                      }}
                      className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center justify-center cursor-pointer"
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
                      title="Delete category"
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
          
          <FormSelect
            label="Parent Category (Optional)"
            value={newCategory.parent || ''}
            onChange={(e) => setNewCategory(prev => ({ ...prev, parent: e.target.value || null }))}
            options={[
              { value: '', label: 'None' },
              ...parentOptions
            ]}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input 
              type="color" 
              value={newCategory.color}
              onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
            />
          </div>
          
          <FormField
            label="Icon (Emoji)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="e.g., 🛒"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
              <input 
                type="number" 
                value={newCategory.monthlyBudget || ''}
                onChange={(e) => setNewCategory(prev => ({ ...prev, monthlyBudget: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddModal(false)
                resetNewCategory()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={addCategory}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center cursor-pointer"
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
            />
            
            <FormSelect
              label="Parent Category (Optional)"
              value={editingCategory.parent || ''}
              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, parent: e.target.value || null } : null)}
              options={[
                { value: '', label: 'None' },
                ...parentOptions
              ]}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <input 
                type="color" 
                value={editingCategory.color}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
                className="w-full h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
              />
            </div>
            
            <FormField
              label="Icon (Emoji)"
              value={editingCategory.icon}
              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, icon: e.target.value } : null)}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                <input 
                  type="number" 
                  value={editingCategory.monthlyBudget || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, monthlyBudget: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={editCategory}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center cursor-pointer"
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