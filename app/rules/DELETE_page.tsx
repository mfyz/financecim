'use client'

import { useState } from 'react'
import { DataTable, Column } from '@/components/tables'
import { CrudModal } from '@/components/ui'
import { Form, FormField, FormTextarea, FormSelect, FormActions } from '@/components/forms'
import { Plus, Edit, Trash2, Play } from 'lucide-react'

interface Rule {
  id: string
  name: string
  description: string
  condition: {
    field: 'description' | 'amount' | 'source'
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with'
    value: string
  }
  action: {
    type: 'set_category' | 'set_description' | 'flag'
    value: string
  }
  isActive: boolean
  priority: number
  matchCount: number
  lastRun?: string
}

// Mock data
const mockRules: Rule[] = [
  {
    id: '1',
    name: 'Grocery Store Auto-Categorization',
    description: 'Automatically categorize transactions from grocery stores',
    condition: {
      field: 'description',
      operator: 'contains',
      value: 'WALMART'
    },
    action: {
      type: 'set_category',
      value: 'Groceries'
    },
    isActive: true,
    priority: 1,
    matchCount: 45,
    lastRun: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Gas Station Categorization',
    description: 'Categorize gas station purchases',
    condition: {
      field: 'description',
      operator: 'contains',
      value: 'SHELL'
    },
    action: {
      type: 'set_category',
      value: 'Transportation'
    },
    isActive: true,
    priority: 2,
    matchCount: 23,
    lastRun: '2024-01-19T15:45:00Z'
  },
  {
    id: '3',
    name: 'Large Expense Flag',
    description: 'Flag transactions over $500 for review',
    condition: {
      field: 'amount',
      operator: 'greater_than',
      value: '500'
    },
    action: {
      type: 'flag',
      value: 'Large Expense'
    },
    isActive: true,
    priority: 3,
    matchCount: 8,
    lastRun: '2024-01-20T08:15:00Z'
  }
]

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(mockRules)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    action: 'create' | 'view' | 'edit' | 'delete'
    item?: Rule
  }>({ isOpen: false, action: 'create' })
  const [formData, setFormData] = useState<Partial<Rule>>({})

  const columns: Column<Rule>[] = [
    {
      key: 'name',
      header: 'Rule',
      sortable: true,
      filterable: true,
      render: (rule) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {rule.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {rule.description}
          </div>
        </div>
      )
    },
    {
      key: 'condition',
      header: 'Condition',
      render: (rule) => (
        <div className="text-sm">
          <span className="font-medium">{rule.condition.field}</span>
          <span className="mx-1 text-gray-500">{rule.condition.operator.replace('_', ' ')}</span>
          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            "{rule.condition.value}"
          </span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (rule) => (
        <div className="text-sm">
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {rule.action.type.replace('_', ' ')}
          </span>
          {rule.action.value && (
            <>
              <span className="mx-1 text-gray-500">→</span>
              <span>{rule.action.value}</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      className: 'text-center',
      render: (rule) => (
        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
          {rule.priority}
        </span>
      )
    },
    {
      key: 'matchCount',
      header: 'Matches',
      sortable: true,
      className: 'text-right',
      render: (rule) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {rule.matchCount}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (rule) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          rule.isActive
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {rule.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  const handleRowClick = (rule: Rule) => {
    setModalState({ isOpen: true, action: 'view', item: rule })
    setFormData(rule)
  }

  const openModal = (action: 'create' | 'edit' | 'delete', item?: Rule) => {
    setModalState({ isOpen: true, action, item })
    setFormData(item || { 
      isActive: true, 
      priority: rules.length + 1, 
      matchCount: 0,
      condition: { field: 'description', operator: 'contains', value: '' },
      action: { type: 'set_category', value: '' }
    })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, action: 'create' })
    setFormData({})
  }

  const handleSave = () => {
    if (modalState.action === 'create') {
      const newRule: Rule = {
        id: Date.now().toString(),
        matchCount: 0,
        ...formData as Rule
      }
      setRules(prev => [...prev, newRule])
    } else if (modalState.action === 'edit' && modalState.item) {
      setRules(prev => prev.map(r => 
        r.id === modalState.item!.id 
          ? { ...modalState.item!, ...formData }
          : r
      ))
    }
    closeModal()
  }

  const handleDelete = () => {
    if (modalState.item) {
      setRules(prev => prev.filter(r => r.id !== modalState.item!.id))
    }
    closeModal()
  }

  const runRule = (rule: Rule) => {
    // Simulate running a rule
    console.log('Running rule:', rule.name)
    setRules(prev => prev.map(r => 
      r.id === rule.id 
        ? { ...r, lastRun: new Date().toISOString() }
        : r
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rules</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automate transaction categorization and processing
          </p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      <DataTable
        data={rules}
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
        title={`${modalState.action === 'create' ? 'Add' : modalState.action === 'view' ? 'View' : modalState.action === 'edit' ? 'Edit' : 'Delete'} Rule`}
        onSave={modalState.action !== 'view' && modalState.action !== 'delete' ? handleSave : undefined}
        onDelete={modalState.action === 'delete' ? handleDelete : undefined}
        size="lg"
      >
        {modalState.action === 'delete' ? (
          <p>Are you sure you want to delete "{modalState.item?.name}"? This rule has matched {modalState.item?.matchCount} transactions.</p>
        ) : (
          <Form>
            <FormField
              label="Name"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={modalState.action === 'view'}
            />
            
            <FormTextarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={modalState.action === 'view'}
              rows={2}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect
                label="Field"
                required
                value={formData.condition?.field || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition: { ...prev.condition!, field: e.target.value as Rule['condition']['field'] }
                }))}
                disabled={modalState.action === 'view'}
                options={[
                  { value: 'description', label: 'Description' },
                  { value: 'amount', label: 'Amount' },
                  { value: 'source', label: 'Source' }
                ]}
              />
              
              <FormSelect
                label="Operator"
                required
                value={formData.condition?.operator || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition: { ...prev.condition!, operator: e.target.value as Rule['condition']['operator'] }
                }))}
                disabled={modalState.action === 'view'}
                options={[
                  { value: 'contains', label: 'Contains' },
                  { value: 'equals', label: 'Equals' },
                  { value: 'starts_with', label: 'Starts with' },
                  { value: 'ends_with', label: 'Ends with' },
                  { value: 'greater_than', label: 'Greater than' },
                  { value: 'less_than', label: 'Less than' }
                ]}
              />
              
              <FormField
                label="Value"
                required
                value={formData.condition?.value || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition: { ...prev.condition!, value: e.target.value }
                }))}
                disabled={modalState.action === 'view'}
                placeholder="Enter condition value"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Action Type"
                required
                value={formData.action?.type || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  action: { ...prev.action!, type: e.target.value as Rule['action']['type'] }
                }))}
                disabled={modalState.action === 'view'}
                options={[
                  { value: 'set_category', label: 'Set Category' },
                  { value: 'set_description', label: 'Set Description' },
                  { value: 'flag', label: 'Add Flag' }
                ]}
              />
              
              <FormField
                label="Action Value"
                required
                value={formData.action?.value || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  action: { ...prev.action!, value: e.target.value }
                }))}
                disabled={modalState.action === 'view'}
                placeholder="Enter action value"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Priority"
                type="number"
                min="1"
                required
                value={formData.priority || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                disabled={modalState.action === 'view'}
                hint="Lower numbers run first"
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
            </div>
            
            {modalState.action === 'view' && (
              <>
                <FormField
                  label="Matches"
                  value={modalState.item?.matchCount?.toString() || '0'}
                  disabled
                />
                {modalState.item?.lastRun && (
                  <FormField
                    label="Last Run"
                    value={new Date(modalState.item.lastRun).toLocaleString()}
                    disabled
                  />
                )}
              </>
            )}
          </Form>
        )}
      </CrudModal>
    </div>
  )
}