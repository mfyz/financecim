'use client'

import { useState } from 'react'
import { DataTable, Column } from '@/components/tables'
import { CrudModal } from '@/components/ui'
import { Form, FormField, FormTextarea, FormSelect, FormActions } from '@/components/forms'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  parentId?: string
  color: string
  description: string
  isActive: boolean
  transactionCount: number
}

// Mock data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Groceries',
    type: 'expense',
    color: '#10B981',
    description: 'Food and household items',
    isActive: true,
    transactionCount: 45
  },
  {
    id: '2',
    name: 'Transportation',
    type: 'expense',
    color: '#3B82F6',
    description: 'Gas, public transport, car maintenance',
    isActive: true,
    transactionCount: 23
  },
  {
    id: '3',
    name: 'Salary',
    type: 'income',
    color: '#059669',
    description: 'Primary income from employment',
    isActive: true,
    transactionCount: 12
  },
  {
    id: '4',
    name: 'Entertainment',
    type: 'expense',
    color: '#8B5CF6',
    description: 'Movies, dining out, hobbies',
    isActive: true,
    transactionCount: 34
  },
  {
    id: '5',
    name: 'Utilities',
    type: 'expense',
    color: '#F59E0B',
    description: 'Electric, water, internet, phone',
    isActive: true,
    transactionCount: 18
  }
]

const colorOptions = [
  { value: '#10B981', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#EF4444', label: 'Red' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#F97316', label: 'Orange' }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    action: 'create' | 'view' | 'edit' | 'delete'
    item?: Category
  }>({ isOpen: false, action: 'create' })
  const [formData, setFormData] = useState<Partial<Category>>({})

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      filterable: true,
      render: (category) => (
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {category.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {category.description}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      filterable: true,
      render: (category) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          category.type === 'income'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {category.type}
        </span>
      )
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      sortable: true,
      className: 'text-right',
      render: (category) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {category.transactionCount}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (category) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          category.isActive
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  const handleRowClick = (category: Category) => {
    setModalState({ isOpen: true, action: 'view', item: category })
    setFormData(category)
  }

  const openModal = (action: 'create' | 'edit' | 'delete', item?: Category) => {
    setModalState({ isOpen: true, action, item })
    setFormData(item || { color: '#10B981', isActive: true, transactionCount: 0 })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, action: 'create' })
    setFormData({})
  }

  const handleSave = () => {
    if (modalState.action === 'create') {
      const newCategory: Category = {
        id: Date.now().toString(),
        transactionCount: 0,
        ...formData as Category
      }
      setCategories(prev => [...prev, newCategory])
    } else if (modalState.action === 'edit' && modalState.item) {
      setCategories(prev => prev.map(c => 
        c.id === modalState.item!.id 
          ? { ...modalState.item!, ...formData }
          : c
      ))
    }
    closeModal()
  }

  const handleDelete = () => {
    if (modalState.item) {
      setCategories(prev => prev.filter(c => c.id !== modalState.item!.id))
    }
    closeModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your transactions by category
          </p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        onRowClick={handleRowClick}
        searchable
        filterable
        pagination
        pageSize={10}
      />

      <CrudModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        action={modalState.action}
        item={modalState.item}
        title={`${modalState.action === 'create' ? 'Add' : modalState.action === 'view' ? 'View' : modalState.action === 'edit' ? 'Edit' : 'Delete'} Category`}
        onSave={modalState.action !== 'view' && modalState.action !== 'delete' ? handleSave : undefined}
        onDelete={modalState.action === 'delete' ? handleDelete : undefined}
        size="md"
      >
        {modalState.action === 'delete' ? (
          <p>Are you sure you want to delete "{modalState.item?.name}"? This action cannot be undone and will affect {modalState.item?.transactionCount} transactions.</p>
        ) : (
          <Form>
            <FormField
              label="Name"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={modalState.action === 'view'}
            />
            
            <FormSelect
              label="Type"
              required
              value={formData.type || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Category['type'] }))}
              disabled={modalState.action === 'view'}
              options={[
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' }
              ]}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    disabled={modalState.action === 'view'}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value 
                        ? 'border-gray-900 dark:border-white' 
                        : 'border-gray-300 dark:border-gray-600'
                    } ${modalState.action === 'view' ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            
            <FormTextarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={modalState.action === 'view'}
              rows={3}
            />
            
            <FormSelect
              label="Status"
              required
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
              disabled={modalState.action === 'view'}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
            
            {modalState.action === 'view' && (
              <FormField
                label="Transaction Count"
                value={modalState.item?.transactionCount?.toString() || '0'}
                disabled
              />
            )}
          </Form>
        )}
      </CrudModal>
    </div>
  )
}