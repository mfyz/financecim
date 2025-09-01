'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Play, Pause, ChevronUp, ChevronDown, Building2, FileText, Tag } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Form, FormField, FormSelect } from '@/components/forms'

interface UnitRule {
  id: number
  ruleType: 'source' | 'description'
  type?: 'contains' | 'starts_with' | 'regex'
  pattern: string
  unit: string
  priority: number
  active: boolean
}

interface CategoryRule {
  id: number
  ruleType: 'source_category' | 'description'
  type: 'exact' | 'contains' | 'starts_with' | 'regex'
  pattern: string
  category: string
  priority: number
  active: boolean
}

interface NewUnitRule {
  ruleType: 'source' | 'description'
  type: 'contains' | 'starts_with' | 'regex'
  pattern: string
  unit: string
}

interface NewCategoryRule {
  ruleType: 'source_category' | 'description'
  type: 'exact' | 'contains' | 'starts_with' | 'regex'
  pattern: string
  category: string
}

// Mock data matching the prototype with "Test" prefix
const unitOptions = [
  { id: 1, name: 'Test Personal', color: '#6B7280' },
  { id: 2, name: 'Test Main Business', color: '#3B82F6' },
  { id: 3, name: 'Test Side Hustle', color: '#10B981' },
  { id: 4, name: 'Test Real Estate', color: '#F59E0B' }
]

const sourceOptions = [
  'Test Chase Bank',
  'Test Capital One',
  'Test Business Credit Card',
  'Test Savings Account'
]

const initialUnitRules: UnitRule[] = [
  { id: 1, ruleType: 'source', pattern: 'Test Chase Bank', unit: 'Test Main Business', priority: 1, active: true },
  { id: 2, ruleType: 'source', pattern: 'Test Capital One', unit: 'Test Personal', priority: 2, active: true },
  { id: 3, ruleType: 'description', type: 'contains', pattern: 'AMAZON WEB SERVICES', unit: 'Test Side Hustle', priority: 3, active: true },
  { id: 4, ruleType: 'description', type: 'contains', pattern: 'HOME DEPOT', unit: 'Test Real Estate', priority: 4, active: true },
  { id: 5, ruleType: 'description', type: 'starts_with', pattern: 'AWS', unit: 'Test Side Hustle', priority: 5, active: true },
  { id: 6, ruleType: 'source', pattern: 'Test Business Credit Card', unit: 'Test Side Hustle', priority: 6, active: true }
]

const initialCategoryRules: CategoryRule[] = [
  { id: 1, ruleType: 'description', type: 'contains', pattern: 'WALMART', category: 'Test Groceries', priority: 1, active: true },
  { id: 2, ruleType: 'description', type: 'contains', pattern: 'TARGET', category: 'Test Shopping', priority: 2, active: true },
  { id: 3, ruleType: 'description', type: 'starts_with', pattern: 'SHELL', category: 'Test Gas', priority: 3, active: true },
  { id: 4, ruleType: 'source_category', type: 'exact', pattern: 'Groceries', category: 'Test Groceries', priority: 4, active: true },
  { id: 5, ruleType: 'source_category', type: 'contains', pattern: 'Food', category: 'Test Restaurants', priority: 5, active: true },
  { id: 6, ruleType: 'description', type: 'contains', pattern: 'STARBUCKS', category: 'Test Restaurants', priority: 6, active: true },
  { id: 7, ruleType: 'description', type: 'regex', pattern: '^UBER.*EATS', category: 'Test Restaurants', priority: 7, active: false },
  { id: 8, ruleType: 'description', type: 'contains', pattern: 'NETFLIX', category: 'Test Entertainment', priority: 8, active: true },
  { id: 9, ruleType: 'source_category', type: 'exact', pattern: 'Bills & Utilities', category: 'Test Bills & Utilities', priority: 9, active: true }
]

const categoryOptions = [
  'Test Groceries',
  'Test Restaurants', 
  'Test Gas',
  'Test Shopping',
  'Test Entertainment',
  'Test Bills & Utilities',
  'Test Transportation'
]

export default function RulesPage() {
  const [unitRules, setUnitRules] = useState<UnitRule[]>(initialUnitRules)
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(initialCategoryRules)
  
  // Unit Rule Modals
  const [showAddUnitRuleModal, setShowAddUnitRuleModal] = useState(false)
  const [showEditUnitRuleModal, setShowEditUnitRuleModal] = useState(false)
  const [editingUnitRule, setEditingUnitRule] = useState<UnitRule | null>(null)
  const [newUnitRule, setNewUnitRule] = useState<NewUnitRule>({
    ruleType: 'description',
    type: 'contains',
    pattern: '',
    unit: ''
  })

  // Category Rule Modals
  const [showAddCategoryRuleModal, setShowAddCategoryRuleModal] = useState(false)
  const [showEditCategoryRuleModal, setShowEditCategoryRuleModal] = useState(false)
  const [editingCategoryRule, setEditingCategoryRule] = useState<CategoryRule | null>(null)
  const [newCategoryRule, setNewCategoryRule] = useState<NewCategoryRule>({
    ruleType: 'description',
    type: 'contains',
    pattern: '',
    category: ''
  })

  // Test Modal
  const [showTestModal, setShowTestModal] = useState(false)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [currentTestRule, setCurrentTestRule] = useState<UnitRule | CategoryRule | null>(null)

  const resetNewUnitRule = () => {
    setNewUnitRule({
      ruleType: 'description',
      type: 'contains',
      pattern: '',
      unit: ''
    })
  }

  const resetNewCategoryRule = () => {
    setNewCategoryRule({
      ruleType: 'description',
      type: 'contains',
      pattern: '',
      category: ''
    })
  }

  const addUnitRule = () => {
    if (newUnitRule.pattern.trim() && newUnitRule.unit) {
      const newId = Math.max(...unitRules.map(r => r.id)) + 1
      const newPriority = Math.max(...unitRules.map(r => r.priority)) + 1
      
      const rule: UnitRule = {
        id: newId,
        ruleType: newUnitRule.ruleType,
        pattern: newUnitRule.pattern,
        unit: newUnitRule.unit,
        priority: newPriority,
        active: true
      }
      
      if (newUnitRule.ruleType === 'description') {
        rule.type = newUnitRule.type
      }
      
      setUnitRules(prev => [...prev, rule])
      setShowAddUnitRuleModal(false)
      resetNewUnitRule()
    }
  }

  const editUnitRule = () => {
    if (editingUnitRule) {
      setUnitRules(prev => prev.map(r => 
        r.id === editingUnitRule.id ? { ...editingUnitRule } : r
      ))
      setShowEditUnitRuleModal(false)
      setEditingUnitRule(null)
    }
  }

  const deleteUnitRule = (ruleId: number) => {
    if (confirm('Are you sure you want to delete this unit rule?')) {
      setUnitRules(prev => prev.filter(r => r.id !== ruleId))
    }
  }

  const toggleUnitRule = (ruleId: number) => {
    setUnitRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, active: !r.active } : r
    ))
  }

  const addCategoryRule = () => {
    if (newCategoryRule.pattern.trim() && newCategoryRule.category) {
      const newId = Math.max(...categoryRules.map(r => r.id)) + 1
      const newPriority = Math.max(...categoryRules.map(r => r.priority)) + 1
      
      const rule: CategoryRule = {
        id: newId,
        ruleType: newCategoryRule.ruleType,
        type: newCategoryRule.type,
        pattern: newCategoryRule.pattern,
        category: newCategoryRule.category,
        priority: newPriority,
        active: true
      }
      
      setCategoryRules(prev => [...prev, rule])
      setShowAddCategoryRuleModal(false)
      resetNewCategoryRule()
    }
  }

  const editCategoryRule = () => {
    if (editingCategoryRule) {
      setCategoryRules(prev => prev.map(r => 
        r.id === editingCategoryRule.id ? { ...editingCategoryRule } : r
      ))
      setShowEditCategoryRuleModal(false)
      setEditingCategoryRule(null)
    }
  }

  const deleteCategoryRule = (ruleId: number) => {
    if (confirm('Are you sure you want to delete this category rule?')) {
      setCategoryRules(prev => prev.filter(r => r.id !== ruleId))
    }
  }

  const toggleCategoryRule = (ruleId: number) => {
    setCategoryRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, active: !r.active } : r
    ))
  }

  const moveUp = (rule: UnitRule | CategoryRule, ruleArray: UnitRule[] | CategoryRule[], setRules: any) => {
    const index = ruleArray.findIndex(r => r.id === rule.id)
    if (index > 0) {
      const newArray = [...ruleArray]
      const temp = newArray[index].priority
      newArray[index].priority = newArray[index - 1].priority
      newArray[index - 1].priority = temp
      newArray.sort((a, b) => a.priority - b.priority)
      setRules(newArray)
    }
  }

  const moveDown = (rule: UnitRule | CategoryRule, ruleArray: UnitRule[] | CategoryRule[], setRules: any) => {
    const index = ruleArray.findIndex(r => r.id === rule.id)
    if (index < ruleArray.length - 1) {
      const newArray = [...ruleArray]
      const temp = newArray[index].priority
      newArray[index].priority = newArray[index + 1].priority
      newArray[index + 1].priority = temp
      newArray.sort((a, b) => a.priority - b.priority)
      setRules(newArray)
    }
  }

  const testRule = (rule: UnitRule | CategoryRule) => {
    if (!testText) {
      setTestResult('Please enter test text')
      return
    }
    
    let matches = false
    
    if ('unit' in rule) { // Unit rule
      if (rule.ruleType === 'source') {
        matches = testText.toUpperCase().includes(rule.pattern.toUpperCase())
        setTestResult(matches 
          ? `✅ Match! Would assign unit: ${rule.unit}` 
          : '❌ No match')
      } else if (rule.ruleType === 'description') {
        const text = testText.toUpperCase()
        const pattern = rule.pattern.toUpperCase()
        
        if (rule.type === 'contains') {
          matches = text.includes(pattern)
        } else if (rule.type === 'starts_with') {
          matches = text.startsWith(pattern)
        } else if (rule.type === 'regex') {
          try {
            const regex = new RegExp(rule.pattern)
            matches = regex.test(text)
          } catch (e) {
            setTestResult('Invalid regex pattern')
            return
          }
        }
        
        setTestResult(matches 
          ? `✅ Match! Would assign unit: ${rule.unit}` 
          : '❌ No match')
      }
    } else { // Category rule
      if (rule.ruleType === 'source_category') {
        const text = testText.toUpperCase()
        const pattern = rule.pattern.toUpperCase()
        
        if (rule.type === 'exact') {
          matches = text === pattern
        } else if (rule.type === 'contains') {
          matches = text.includes(pattern)
        } else if (rule.type === 'starts_with') {
          matches = text.startsWith(pattern)
        } else if (rule.type === 'regex') {
          try {
            const regex = new RegExp(rule.pattern)
            matches = regex.test(text)
          } catch (e) {
            setTestResult('Invalid regex pattern')
            return
          }
        }
        
        setTestResult(matches 
          ? `✅ Match! Would categorize as: ${rule.category}` 
          : '❌ No match')
      } else if (rule.ruleType === 'description') {
        const text = testText.toUpperCase()
        const pattern = rule.pattern.toUpperCase()
        
        if (rule.type === 'contains') {
          matches = text.includes(pattern)
        } else if (rule.type === 'starts_with') {
          matches = text.startsWith(pattern)
        } else if (rule.type === 'regex') {
          try {
            const regex = new RegExp(rule.pattern)
            matches = regex.test(text)
          } catch (e) {
            setTestResult('Invalid regex pattern')
            return
          }
        }
        
        setTestResult(matches 
          ? `✅ Match! Would categorize as: ${rule.category}` 
          : '❌ No match')
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit Rule
            </button>
          </div>
        </div>

        {/* Unit Rules Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden mb-8">
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
                          onClick={() => moveUp(rule, unitRules, setUnitRules)}
                          disabled={rule.priority === 1}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => moveDown(rule, unitRules, setUnitRules)}
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
                          {rule.type}
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
                        style={{ backgroundColor: unitOptions.find(u => u.name === rule.unit)?.color || '#6B7280' }}
                      ></div>
                      <span>{rule.unit}</span>
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

      {/* Auto-Category Rules Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Auto-Category Rules</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Automatically categorize transactions based on source category or description patterns</p>
          </div>
          <button 
            onClick={() => setShowAddCategoryRuleModal(true)}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category Rule
          </button>
        </div>
      </div>

      {/* Category Rules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden">
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
                        onClick={() => moveUp(rule, categoryRules, setCategoryRules)}
                        disabled={rule.priority === 1}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => moveDown(rule, categoryRules, setCategoryRules)}
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
                      {rule.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                    {rule.pattern}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span>{rule.category}</span>
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
              value={newUnitRule.type}
              onChange={(e) => setNewUnitRule(prev => ({ ...prev, type: e.target.value as 'contains' | 'starts_with' | 'regex' }))}
              options={[
                { value: 'contains', label: 'Contains' },
                { value: 'starts_with', label: 'Starts With' },
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
                ...sourceOptions.map(source => ({ value: source, label: source }))
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
            value={newUnitRule.unit}
            onChange={(e) => setNewUnitRule(prev => ({ ...prev, unit: e.target.value }))}
            options={[
              { value: '', label: 'Select unit...' },
              ...unitOptions.map(unit => ({ value: unit.name, label: unit.name }))
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
                value={editingUnitRule.type || 'contains'}
                onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, type: e.target.value as 'contains' | 'starts_with' | 'regex' } : null)}
                options={[
                  { value: 'contains', label: 'Contains' },
                  { value: 'starts_with', label: 'Starts With' },
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
                options={sourceOptions.map(source => ({ value: source, label: source }))}
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
              value={editingUnitRule.unit}
              onChange={(e) => setEditingUnitRule(prev => prev ? { ...prev, unit: e.target.value } : null)}
              options={unitOptions.map(unit => ({ value: unit.name, label: unit.name }))}
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
            value={newCategoryRule.type}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, type: e.target.value as 'exact' | 'contains' | 'starts_with' | 'regex' }))}
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
            value={newCategoryRule.category}
            onChange={(e) => setNewCategoryRule(prev => ({ ...prev, category: e.target.value }))}
            options={[
              { value: '', label: 'Select category...' },
              ...categoryOptions.map(category => ({ value: category, label: category }))
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
              value={editingCategoryRule.type}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, type: e.target.value as 'exact' | 'contains' | 'starts_with' | 'regex' } : null)}
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
              value={editingCategoryRule.category}
              onChange={(e) => setEditingCategoryRule(prev => prev ? { ...prev, category: e.target.value } : null)}
              options={categoryOptions.map(category => ({ value: category, label: category }))}
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
                    {'type' in currentTestRule ? currentTestRule.type : 'source'}
                  </span>
                  <code className="bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded text-xs ml-2">
                    {currentTestRule.pattern}
                  </code>
                </p>
                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                  → <span>{'unit' in currentTestRule ? currentTestRule.unit : currentTestRule.category}</span>
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