'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Pause, ChevronUp, ChevronDown, Building2, FileText, Tag } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Form, FormField, FormSelect } from '@/components/forms'
import { toast } from 'sonner'

interface Unit {
  id: number
  name: string
  color: string
  icon?: string | null
  active: boolean
}

interface Category {
  id: number
  name: string
  parentCategoryId?: number | null
  color: string
  icon?: string | null
}

interface UnitRule {
  id: number
  ruleType: 'source' | 'description'
  matchType: 'contains' | 'starts_with' | 'exact' | 'regex'
  pattern: string
  unitId: number
  priority: number
  active: boolean
  unit?: Unit
}

interface CategoryRule {
  id: number
  ruleType: 'source_category' | 'description'
  matchType: 'exact' | 'contains' | 'starts_with' | 'regex'
  pattern: string
  categoryId: number
  priority: number
  active: boolean
  category?: Category
}

interface NewUnitRule {
  ruleType: 'source' | 'description'
  matchType: 'contains' | 'starts_with' | 'exact' | 'regex'
  pattern: string
  unitId: number
}

interface NewCategoryRule {
  ruleType: 'source_category' | 'description'
  matchType: 'exact' | 'contains' | 'starts_with' | 'regex'
  pattern: string
  categoryId: number
}

interface Source {
  id: number
  name: string
  type: string
}


export default function RulesPage() {
  const [unitRules, setUnitRules] = useState<UnitRule[]>([])
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  
  // Unit Rule Modals
  const [showAddUnitRuleModal, setShowAddUnitRuleModal] = useState(false)
  const [showEditUnitRuleModal, setShowEditUnitRuleModal] = useState(false)
  const [editingUnitRule, setEditingUnitRule] = useState<UnitRule | null>(null)
  const [newUnitRule, setNewUnitRule] = useState<NewUnitRule>({
    ruleType: 'description',
    matchType: 'contains',
    pattern: '',
    unitId: 0
  })

  // Category Rule Modals
  const [showAddCategoryRuleModal, setShowAddCategoryRuleModal] = useState(false)
  const [showEditCategoryRuleModal, setShowEditCategoryRuleModal] = useState(false)
  const [editingCategoryRule, setEditingCategoryRule] = useState<CategoryRule | null>(null)
  const [newCategoryRule, setNewCategoryRule] = useState<NewCategoryRule>({
    ruleType: 'description',
    matchType: 'contains',
    pattern: '',
    categoryId: 0
  })

  // Test Modal
  const [showTestModal, setShowTestModal] = useState(false)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [currentTestRule, setCurrentTestRule] = useState<UnitRule | CategoryRule | null>(null)

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [unitsRes, categoriesRes, sourcesRes, unitRulesRes, categoryRulesRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/categories'),
        fetch('/api/sources'),
        fetch('/api/rules/unit'),
        fetch('/api/rules/category')
      ])

      const [unitsData, categoriesData, sourcesData, unitRulesData, categoryRulesData] = await Promise.all([
        unitsRes.json(),
        categoriesRes.json(),
        sourcesRes.json(),
        unitRulesRes.json(),
        categoryRulesRes.json()
      ])

      setUnits(unitsData)
      setCategories(categoriesData)
      setSources(sourcesData)
      setUnitRules(unitRulesData)
      setCategoryRules(categoryRulesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const resetNewUnitRule = () => {
    setNewUnitRule({
      ruleType: 'description',
      matchType: 'contains',
      pattern: '',
      unitId: 0
    })
  }

  const resetNewCategoryRule = () => {
    setNewCategoryRule({
      ruleType: 'description',
      matchType: 'contains',
      pattern: '',
      categoryId: 0
    })
  }

  const addUnitRule = async () => {
    if (newUnitRule.pattern.trim() && newUnitRule.unitId > 0) {
      try {
        const newPriority = unitRules.length > 0 ? Math.max(...unitRules.map(r => r.priority)) + 1 : 1

        const response = await fetch('/api/rules/unit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleType: newUnitRule.ruleType,
            pattern: newUnitRule.pattern,
            matchType: newUnitRule.matchType,
            unitId: newUnitRule.unitId,
            priority: newPriority,
            active: true
          })
        })

        if (!response.ok) throw new Error('Failed to create unit rule')

        const createdRule = await response.json()
        setUnitRules(prev => [...prev, createdRule])
        setShowAddUnitRuleModal(false)
        resetNewUnitRule()
        toast.success('Unit rule created successfully')
      } catch (error) {
        console.error('Error creating unit rule:', error)
        toast.error('Failed to create unit rule')
      }
    }
  }

  const editUnitRule = async () => {
    if (editingUnitRule) {
      try {
        const response = await fetch(`/api/rules/unit/${editingUnitRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleType: editingUnitRule.ruleType,
            pattern: editingUnitRule.pattern,
            matchType: editingUnitRule.matchType,
            unitId: editingUnitRule.unitId,
            priority: editingUnitRule.priority,
            active: editingUnitRule.active
          })
        })

        if (!response.ok) throw new Error('Failed to update unit rule')

        const updatedRule = await response.json()
        setUnitRules(prev => prev.map(r =>
          r.id === editingUnitRule.id ? updatedRule : r
        ))
        setShowEditUnitRuleModal(false)
        setEditingUnitRule(null)
        toast.success('Unit rule updated successfully')
      } catch (error) {
        console.error('Error updating unit rule:', error)
        toast.error('Failed to update unit rule')
      }
    }
  }

  const deleteUnitRule = async (ruleId: number) => {
    if (confirm('Are you sure you want to delete this unit rule?')) {
      try {
        const response = await fetch(`/api/rules/unit/${ruleId}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Failed to delete unit rule')

        setUnitRules(prev => prev.filter(r => r.id !== ruleId))
        toast.success('Unit rule deleted successfully')
      } catch (error) {
        console.error('Error deleting unit rule:', error)
        toast.error('Failed to delete unit rule')
      }
    }
  }

  const toggleUnitRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/rules/unit/${ruleId}/toggle`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle unit rule')

      const updatedRule = await response.json()
      setUnitRules(prev => prev.map(r =>
        r.id === ruleId ? updatedRule : r
      ))
      toast.success('Unit rule toggled successfully')
    } catch (error) {
      console.error('Error toggling unit rule:', error)
      toast.error('Failed to toggle unit rule')
    }
  }

  const addCategoryRule = async () => {
    if (newCategoryRule.pattern.trim() && newCategoryRule.categoryId > 0) {
      try {
        const newPriority = categoryRules.length > 0 ? Math.max(...categoryRules.map(r => r.priority)) + 1 : 1

        const response = await fetch('/api/rules/category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleType: newCategoryRule.ruleType,
            pattern: newCategoryRule.pattern,
            matchType: newCategoryRule.matchType,
            categoryId: newCategoryRule.categoryId,
            priority: newPriority,
            active: true
          })
        })

        if (!response.ok) throw new Error('Failed to create category rule')

        const createdRule = await response.json()
        setCategoryRules(prev => [...prev, createdRule])
        setShowAddCategoryRuleModal(false)
        resetNewCategoryRule()
        toast.success('Category rule created successfully')
      } catch (error) {
        console.error('Error creating category rule:', error)
        toast.error('Failed to create category rule')
      }
    }
  }

  const editCategoryRule = async () => {
    if (editingCategoryRule) {
      try {
        const response = await fetch(`/api/rules/category/${editingCategoryRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleType: editingCategoryRule.ruleType,
            pattern: editingCategoryRule.pattern,
            matchType: editingCategoryRule.matchType,
            categoryId: editingCategoryRule.categoryId,
            priority: editingCategoryRule.priority,
            active: editingCategoryRule.active
          })
        })

        if (!response.ok) throw new Error('Failed to update category rule')

        const updatedRule = await response.json()
        setCategoryRules(prev => prev.map(r =>
          r.id === editingCategoryRule.id ? updatedRule : r
        ))
        setShowEditCategoryRuleModal(false)
        setEditingCategoryRule(null)
        toast.success('Category rule updated successfully')
      } catch (error) {
        console.error('Error updating category rule:', error)
        toast.error('Failed to update category rule')
      }
    }
  }

  const deleteCategoryRule = async (ruleId: number) => {
    if (confirm('Are you sure you want to delete this category rule?')) {
      try {
        const response = await fetch(`/api/rules/category/${ruleId}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Failed to delete category rule')

        setCategoryRules(prev => prev.filter(r => r.id !== ruleId))
        toast.success('Category rule deleted successfully')
      } catch (error) {
        console.error('Error deleting category rule:', error)
        toast.error('Failed to delete category rule')
      }
    }
  }

  const toggleCategoryRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/rules/category/${ruleId}/toggle`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle category rule')

      const updatedRule = await response.json()
      setCategoryRules(prev => prev.map(r =>
        r.id === ruleId ? updatedRule : r
      ))
      toast.success('Category rule toggled successfully')
    } catch (error) {
      console.error('Error toggling category rule:', error)
      toast.error('Failed to toggle category rule')
    }
  }

  const moveUp = async (rule: UnitRule | CategoryRule, isUnitRule: boolean) => {
    const ruleArray = isUnitRule ? unitRules : categoryRules
    const index = ruleArray.findIndex(r => r.id === rule.id)
    if (index > 0) {
      const newArray = [...ruleArray]
      const temp = newArray[index].priority
      newArray[index].priority = newArray[index - 1].priority
      newArray[index - 1].priority = temp
      newArray.sort((a, b) => a.priority - b.priority)

      // Update priorities on the server
      try {
        const priorities = newArray.map(r => ({ id: r.id, priority: r.priority }))
        const endpoint = isUnitRule ? '/api/rules/unit/priorities' : '/api/rules/category/priorities'
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priorities })
        })

        if (!response.ok) throw new Error('Failed to update priorities')

        if (isUnitRule) {
          setUnitRules(newArray as UnitRule[])
        } else {
          setCategoryRules(newArray as CategoryRule[])
        }
      } catch (error) {
        console.error('Error updating priorities:', error)
        toast.error('Failed to update rule priorities')
      }
    }
  }

  const moveDown = async (rule: UnitRule | CategoryRule, isUnitRule: boolean) => {
    const ruleArray = isUnitRule ? unitRules : categoryRules
    const index = ruleArray.findIndex(r => r.id === rule.id)
    if (index < ruleArray.length - 1) {
      const newArray = [...ruleArray]
      const temp = newArray[index].priority
      newArray[index].priority = newArray[index + 1].priority
      newArray[index + 1].priority = temp
      newArray.sort((a, b) => a.priority - b.priority)

      // Update priorities on the server
      try {
        const priorities = newArray.map(r => ({ id: r.id, priority: r.priority }))
        const endpoint = isUnitRule ? '/api/rules/unit/priorities' : '/api/rules/category/priorities'
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priorities })
        })

        if (!response.ok) throw new Error('Failed to update priorities')

        if (isUnitRule) {
          setUnitRules(newArray as UnitRule[])
        } else {
          setCategoryRules(newArray as CategoryRule[])
        }
      } catch (error) {
        console.error('Error updating priorities:', error)
        toast.error('Failed to update rule priorities')
      }
    }
  }

  const testRule = async (rule: UnitRule | CategoryRule) => {
    if (!testText) {
      setTestResult('Please enter test text')
      return
    }

    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: testText })
      })

      if (!response.ok) throw new Error('Failed to test rule')

      const result = await response.json()

      // Check if this specific rule would match
      let matches = false
      let assignedName = ''

      if ('unitId' in rule) { // Unit rule
        matches = result.unitId === rule.unitId
        const unit = units.find(u => u.id === rule.unitId)
        assignedName = unit?.name || 'Unknown'
        setTestResult(matches
          ? `✅ Match! Would assign unit: ${assignedName}`
          : '❌ No match')
      } else { // Category rule
        matches = result.categoryId === rule.categoryId
        const category = categories.find(c => c.id === rule.categoryId)
        assignedName = category?.name || 'Unknown'
        setTestResult(matches
          ? `✅ Match! Would categorize as: ${assignedName}`
          : '❌ No match')
      }
    } catch (error) {
      console.error('Error testing rule:', error)
      setTestResult('Error testing rule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Automation Rules</h1>
        <p className="text-gray-600 dark:text-gray-300">Configure automatic assignment of units and categories based on transaction patterns</p>
      </div>

      {/* Auto-Unit Rules Section */}
      <div className="mb-12">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Auto-Unit Rules</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Automatically assign business units based on source or transaction description</p>
            </div>
            <button 
              onClick={() => setShowAddUnitRuleModal(true)}
              className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit Rule
            </button>
          </div>
        </div>

        {/* Unit Rules Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rule Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {unitRules.map((rule) => (
                <tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{rule.priority}</span>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => moveUp(rule, true)}
                          disabled={rule.priority === 1}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => moveDown(rule, true)}
                          disabled={rule.priority === unitRules.length}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      {rule.ruleType === 'source' ? (
                        <Building2 className="w-4 h-4 mr-2 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      )}
                      <span className="capitalize">
                        {rule.ruleType === 'source' ? 'Source' : 'Description'}
                      </span>
                      {rule.ruleType === 'description' && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                          {rule.matchType}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                      {rule.pattern}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: rule.unit?.color || units.find(u => u.id === rule.unitId)?.color || '#6B7280' }}
                      ></div>
                      <span>{rule.unit?.name || units.find(u => u.id === rule.unitId)?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="inline-flex rounded-md shadow-sm">
                      <button 
                        onClick={() => {
                          setCurrentTestRule(rule)
                          setShowTestModal(true)
                        }}
                        className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center justify-center"
                        title="Test rule"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleUnitRule(rule.id)}
                        className={`px-2 py-1.5 -ml-px rounded-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 dark:text-gray-300 flex items-center justify-center ${
                          rule.active ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-green-600 dark:hover:text-green-400'
                        }`}
                        title={rule.active ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingUnitRule({ ...rule })
                          setShowEditUnitRuleModal(true)
                        }}
                        className="px-2 py-1.5 -ml-px rounded-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center justify-center"
                        title="Edit rule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUnitRule(rule.id)}
                        className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 flex items-center justify-center"
                        title="Delete rule"
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
        </div>
      </div>

      {/* Auto-Category Rules Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Auto-Category Rules</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Automatically categorize transactions based on source category or description patterns</p>
          </div>
          <button 
            onClick={() => setShowAddCategoryRuleModal(true)}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category Rule
          </button>
        </div>
      </div>

      {/* Category Rules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rule Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pattern</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categoryRules.map((rule) => (
              <tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{rule.priority}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveUp(rule, false)}
                        disabled={rule.priority === 1}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveDown(rule, false)}
                        disabled={rule.priority === categoryRules.length}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    {rule.ruleType === 'source_category' ? (
                      <Tag className="w-4 h-4 mr-2 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    )}
                    <span className="capitalize">
                      {rule.ruleType === 'source_category' ? 'Source Category' : 'Description'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                      {rule.matchType}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                    {rule.pattern}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span>{rule.category?.name || categories.find(c => c.id === rule.categoryId)?.name || 'Unknown'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => toggleCategoryRule(rule.id)}>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button 
                      onClick={() => {
                        setCurrentTestRule(rule)
                        setShowTestModal(true)
                      }}
                      className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center justify-center"
                      title="Test rule"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleCategoryRule(rule.id)}
                      className={`px-2 py-1.5 -ml-px rounded-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 dark:text-gray-300 flex items-center justify-center ${
                        rule.active ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-green-600 dark:hover:text-green-400'
                      }`}
                      title={rule.active ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingCategoryRule({ ...rule })
                        setShowEditCategoryRuleModal(true)
                      }}
                      className="px-2 py-1.5 -ml-px rounded-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center justify-center"
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteCategoryRule(rule.id)}
                      className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 flex items-center justify-center"
                      title="Delete rule"
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
      </div>

      {/* Add Unit Rule Modal */}
      <Modal
        isOpen={showAddUnitRuleModal}
        onClose={() => {
          setShowAddUnitRuleModal(false)
          resetNewUnitRule()
        }}
        title="Add Auto-Unit Rule"
        size="sm"
      >
        <Form>
          <FormSelect
            label="Rule Type"
            required
            value={newUnitRule.ruleType}
            onChange={(e) => setNewUnitRule(prev => ({ ...prev, ruleType: e.target.value as 'source' | 'description' }))}
            options={[
              { value: 'source', label: 'Source-based' },
              { value: 'description', label: 'Description-based' }
            ]}
          />
          
          {newUnitRule.ruleType === 'description' && (
            <FormSelect
              label="Match Type"
              required
              value={newUnitRule.matchType}
              onChange={(e) => setNewUnitRule(prev => ({ ...prev, matchType: e.target.value as 'contains' | 'starts_with' | 'exact' | 'regex' }))}
              options={[
                { value: 'contains', label: 'Contains' },
                { value: 'starts_with', label: 'Starts With' },
                { value: 'exact', label: 'Exact Match' },
                { value: 'regex', label: 'Regular Expression' }
              ]}
            />
          )}

          {newUnitRule.ruleType === 'source' ? (
            <FormSelect
              label="Source"
              required
              value={newUnitRule.pattern}
              onChange={(e) => setNewUnitRule(prev => ({ ...prev, pattern: e.target.value }))}
              options={[
                { value: '', label: 'Select source...' },
                ...sources.map(source => ({ value: source.name, label: source.name }))
              ]}
            />
          ) : (
            <FormField
              label="Pattern"
              required
              value={newUnitRule.pattern}
              onChange={(e) => setNewUnitRule(prev => ({ ...prev, pattern: e.target.value }))}
              placeholder="e.g., AMAZON WEB SERVICES"
            />
          )}
          
          <FormSelect
            label="Unit"
            required
            value={newUnitRule.unitId.toString()}
            onChange={(e) => setNewUnitRule(prev => ({ ...prev, unitId: parseInt(e.target.value) }))}
            options={[
              { value: '0', label: 'Select unit...' },
              ...units.filter(u => u.active).map(unit => ({ value: unit.id.toString(), label: unit.name }))
            ]}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddUnitRuleModal(false)
                resetNewUnitRule()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={addUnitRule}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add Rule
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Unit Rule Modal */}
      <Modal
        isOpen={showEditUnitRuleModal}
        onClose={() => {
          setShowEditUnitRuleModal(false)
          setEditingUnitRule(null)
        }}
        title="Edit Unit Rule"
        size="sm"
      >
        {editingUnitRule && (
          <Form>
            <FormSelect
              label="Rule Type"
              required
              value={editingUnitRule.ruleType}
              onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, ruleType: e.target.value as 'source' | 'description' } : null)}
              options={[
                { value: 'source', label: 'Source-based' },
                { value: 'description', label: 'Description-based' }
              ]}
            />
            
            {editingUnitRule.ruleType === 'description' && (
              <FormSelect
                label="Match Type"
                required
                value={editingUnitRule.matchType || 'contains'}
                onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, matchType: e.target.value as 'contains' | 'starts_with' | 'exact' | 'regex' } : null)}
                options={[
                  { value: 'contains', label: 'Contains' },
                  { value: 'starts_with', label: 'Starts With' },
                  { value: 'exact', label: 'Exact Match' },
                  { value: 'regex', label: 'Regular Expression' }
                ]}
              />
            )}
            
            {editingUnitRule.ruleType === 'source' ? (
              <FormSelect
                label="Source"
                required
                value={editingUnitRule.pattern}
                onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, pattern: e.target.value } : null)}
                options={sources.map(source => ({ value: source.name, label: source.name }))}
              />
            ) : (
              <FormField
                label="Pattern"
                required
                value={editingUnitRule.pattern}
                onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, pattern: e.target.value } : null)}
              />
            )}
            
            <FormSelect
              label="Unit"
              required
              value={editingUnitRule.unitId?.toString() || ''}
              onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, unitId: parseInt(e.target.value) } : null)}
              options={units.filter(u => u.active).map(unit => ({ value: unit.id.toString(), label: unit.name }))}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditUnitRuleModal(false)
                  setEditingUnitRule(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={editUnitRule}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Add Category Rule Modal */}
      <Modal
        isOpen={showAddCategoryRuleModal}
        onClose={() => {
          setShowAddCategoryRuleModal(false)
          resetNewCategoryRule()
        }}
        title="Add Auto-Category Rule"
        size="sm"
      >
        <Form>
          <FormSelect
            label="Rule Type"
            required
            value={newCategoryRule.ruleType}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, ruleType: e.target.value as 'source_category' | 'description' }))}
            options={[
              { value: 'source_category', label: 'Source Category' },
              { value: 'description', label: 'Description' }
            ]}
          />
          
          <FormSelect
            label="Match Type"
            required
            value={newCategoryRule.matchType}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, matchType: e.target.value as 'exact' | 'contains' | 'starts_with' | 'regex' }))}
            options={[
              ...(newCategoryRule.ruleType === 'source_category' ? [{ value: 'exact', label: 'Exact Match' }] : []),
              { value: 'contains', label: 'Contains' },
              { value: 'starts_with', label: 'Starts With' },
              { value: 'regex', label: 'Regular Expression' }
            ]}
          />
          
          <FormField
            label={newCategoryRule.ruleType === 'source_category' ? 'Source Category' : 'Pattern'}
            required
            value={newCategoryRule.pattern}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, pattern: e.target.value }))}
            placeholder={newCategoryRule.ruleType === 'source_category' ? 'e.g., Groceries' : 'e.g., WALMART'}
          />
          
          <FormSelect
            label="Category"
            required
            value={newCategoryRule.categoryId.toString()}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
            options={[
              { value: '0', label: 'Select category...' },
              ...categories.map(category => ({ value: category.id.toString(), label: category.name }))
            ]}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddCategoryRuleModal(false)
                resetNewCategoryRule()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={addCategoryRule}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add Rule
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Category Rule Modal */}
      <Modal
        isOpen={showEditCategoryRuleModal}
        onClose={() => {
          setShowEditCategoryRuleModal(false)
          setEditingCategoryRule(null)
        }}
        title="Edit Category Rule"
        size="sm"
      >
        {editingCategoryRule && (
          <Form>
            <FormSelect
              label="Rule Type"
              required
              value={editingCategoryRule.ruleType}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, ruleType: e.target.value as 'source_category' | 'description' } : null)}
              options={[
                { value: 'source_category', label: 'Source Category' },
                { value: 'description', label: 'Description' }
              ]}
            />
            
            <FormSelect
              label="Match Type"
              required
              value={editingCategoryRule.matchType}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, matchType: e.target.value as 'exact' | 'contains' | 'starts_with' | 'regex' } : null)}
              options={[
                ...(editingCategoryRule.ruleType === 'source_category' ? [{ value: 'exact', label: 'Exact Match' }] : []),
                { value: 'contains', label: 'Contains' },
                { value: 'starts_with', label: 'Starts With' },
                { value: 'regex', label: 'Regular Expression' }
              ]}
            />
            
            <FormField
              label={editingCategoryRule.ruleType === 'source_category' ? 'Source Category' : 'Pattern'}
              required
              value={editingCategoryRule.pattern}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, pattern: e.target.value } : null)}
            />
            
            <FormSelect
              label="Category"
              required
              value={editingCategoryRule.categoryId?.toString() || ''}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, categoryId: parseInt(e.target.value) } : null)}
              options={categories.map(category => ({ value: category.id.toString(), label: category.name }))}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditCategoryRuleModal(false)
                  setEditingCategoryRule(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={editCategoryRule}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false)
          setTestText('')
          setTestResult(null)
          setCurrentTestRule(null)
        }}
        title="Test Rule"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rule:</p>
            {currentTestRule && (
              <>
                <p className="text-sm">
                  <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                    {currentTestRule.matchType || 'source'}
                  </span>
                  <code className="bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded text-xs ml-2">
                    {currentTestRule.pattern}
                  </code>
                </p>
                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                  → <span>
                    {'unitId' in currentTestRule
                      ? (units.find(u => u.id === currentTestRule.unitId)?.name || 'Unknown')
                      : (categories.find(c => c.id === currentTestRule.categoryId)?.name || 'Unknown')}
                  </span>
                </p>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Transaction Description
            </label>
            <input 
              type="text" 
              value={testText}
              onChange={(e) => {
                setTestText(e.target.value)
                if (currentTestRule) {
                  testRule(currentTestRule)
                }
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., WALMART SUPERCENTER #1234"
            />
          </div>
          {testResult && (
            <div className={`p-3 rounded ${
              testResult.includes('✅') 
                ? 'bg-green-50 dark:bg-green-900/30' 
                : 'bg-red-50 dark:bg-red-900/30'
            }`}>
              <p className="text-sm text-gray-900 dark:text-white">{testResult}</p>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button 
              onClick={() => {
                setShowTestModal(false)
                setTestText('')
                setTestResult(null)
                setCurrentTestRule(null)
              }}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}