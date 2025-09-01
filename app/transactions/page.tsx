'use client'

import { useState, useMemo } from 'react'
import { Calendar, Building2, FileText, Tag, DollarSign, Layers, Tags, EyeOff, StickyNote, Settings, Edit2, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'

interface Transaction {
  id: number
  source: string
  date: string
  description: string
  amount: number
  source_category: string
  category: string | null
  unit: string
  ignore: boolean
  notes: string
}

// Mock data matching the prototype with "Test" prefix
const unitOptions = [
  { id: 1, name: 'Test Personal', color: '#6B7280' },
  { id: 2, name: 'Test Main Business', color: '#3B82F6' },
  { id: 3, name: 'Test Side Hustle', color: '#10B981' },
  { id: 4, name: 'Test Real Estate', color: '#F59E0B' }
]

const categoryOptions = [
  { id: 1, name: 'Test Food & Dining', parent: null },
  { id: 2, name: 'Test Groceries', parent: 'Food & Dining' },
  { id: 3, name: 'Test Restaurants', parent: 'Food & Dining' },
  { id: 4, name: 'Test Transportation', parent: null },
  { id: 5, name: 'Test Gas', parent: 'Transportation' },
  { id: 6, name: 'Test Entertainment', parent: null },
  { id: 7, name: 'Test Shopping', parent: null },
  { id: 8, name: 'Test Bills & Utilities', parent: null }
]

const initialTransactions: Transaction[] = [
  { id: 1, source: 'Test Chase Bank', date: '2024-01-20', description: 'WALMART SUPERCENTER #1234', amount: -125.43, source_category: 'Groceries', category: 'Test Groceries', unit: 'Test Personal', ignore: false, notes: '' },
  { id: 2, source: 'Test Chase Bank', date: '2024-01-19', description: 'SHELL GAS STATION', amount: -45.00, source_category: 'Gas & Fuel', category: 'Test Gas', unit: 'Test Personal', ignore: false, notes: 'Fill up' },
  { id: 3, source: 'Test Capital One', date: '2024-01-19', description: 'STARBUCKS STORE #5678', amount: -6.75, source_category: 'Food & Dining', category: 'Test Restaurants', unit: 'Test Main Business', ignore: false, notes: '' },
  { id: 4, source: 'Test Chase Bank', date: '2024-01-18', description: 'TARGET STORE #9012', amount: -89.23, source_category: 'General Merchandise', category: 'Test Shopping', unit: 'Test Personal', ignore: false, notes: '' },
  { id: 5, source: 'Test Capital One', date: '2024-01-18', description: 'NETFLIX.COM', amount: -15.99, source_category: 'Travel & Entertainment', category: 'Test Entertainment', unit: 'Test Personal', ignore: false, notes: 'Monthly subscription' },
  { id: 6, source: 'Test Chase Bank', date: '2024-01-17', description: 'COMCAST CABLE', amount: -120.00, source_category: 'Bills & Utilities', category: 'Test Bills & Utilities', unit: 'Test Main Business', ignore: false, notes: '' },
  { id: 7, source: 'Test Chase Bank', date: '2024-01-17', description: 'PAYCHECK DEPOSIT', amount: 3500.00, source_category: 'Income', category: null, unit: 'Test Main Business', ignore: true, notes: 'Salary' },
  { id: 8, source: 'Test Capital One', date: '2024-01-16', description: 'AMAZON.COM', amount: -42.99, source_category: 'General Merchandise', category: 'Test Shopping', unit: 'Test Side Hustle', ignore: false, notes: '' },
  { id: 9, source: 'Test Chase Bank', date: '2024-01-16', description: 'WHOLE FOODS MARKET', amount: -78.65, source_category: 'Groceries', category: 'Test Groceries', unit: 'Test Personal', ignore: false, notes: '' },
  { id: 10, source: 'Test Capital One', date: '2024-01-15', description: 'UBER EATS', amount: -32.45, source_category: 'Food & Dining', category: 'Test Restaurants', unit: 'Test Main Business', ignore: false, notes: 'Dinner delivery' },
  { id: 11, source: 'Test Chase Bank', date: '2024-01-14', description: 'DIVIDEND PAYMENT', amount: 250.00, source_category: 'Investment', category: null, unit: 'Test Real Estate', ignore: false, notes: 'Quarterly dividend' },
  { id: 12, source: 'Test Capital One', date: '2024-01-13', description: 'CASHBACK REWARD', amount: 45.67, source_category: 'Rewards', category: null, unit: 'Test Personal', ignore: false, notes: '' },
  { id: 13, source: 'Test Chase Bank', date: '2024-01-12', description: 'VENMO PAYMENT FROM FRIEND', amount: 25.00, source_category: 'Transfer', category: null, unit: 'Test Personal', ignore: false, notes: 'Dinner split' },
  { id: 14, source: 'Test Chase Bank', date: '2024-01-11', description: 'INTEREST EARNED', amount: 15.32, source_category: 'Interest', category: null, unit: 'Test Personal', ignore: false, notes: 'Savings account' }
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showIgnored, setShowIgnored] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState('all')
  
  // Sort states
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(t => t.date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.date <= dateTo)
    }
    
    // Unit filter
    if (selectedUnit !== 'all') {
      filtered = filtered.filter(t => t.unit === selectedUnit)
    }
    
    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(t => t.source === selectedSource)
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        filtered = filtered.filter(t => !t.category)
      } else {
        filtered = filtered.filter(t => t.category === selectedCategory)
      }
    }
    
    // Amount filters
    if (amountMin) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(amountMin))
    }
    if (amountMax) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(amountMax))
    }
    
    // Ignored filter
    if (!showIgnored) {
      filtered = filtered.filter(t => !t.ignore)
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date)
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [transactions, searchTerm, dateFrom, dateTo, selectedUnit, selectedSource, selectedCategory, amountMin, amountMax, showIgnored, sortBy, sortOrder])

  const toggleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const toggleTransaction = (id: number) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tid => tid !== id))
    } else {
      setSelectedTransactions([...selectedTransactions, id])
    }
    setShowBulkActions(selectedTransactions.length > 0 || !selectedTransactions.includes(id))
  }

  const selectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
      setShowBulkActions(false)
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id))
      setShowBulkActions(true)
    }
  }

  const bulkCategorize = (category: string) => {
    setTransactions(prev => prev.map(t => 
      selectedTransactions.includes(t.id) ? { ...t, category } : t
    ))
    setSelectedTransactions([])
    setShowBulkActions(false)
  }

  const bulkAssignUnit = (unit: string) => {
    setTransactions(prev => prev.map(t => 
      selectedTransactions.includes(t.id) ? { ...t, unit } : t
    ))
    setSelectedTransactions([])
    setShowBulkActions(false)
  }

  const bulkIgnore = () => {
    setTransactions(prev => prev.map(t => 
      selectedTransactions.includes(t.id) ? { ...t, ignore: !t.ignore } : t
    ))
    setSelectedTransactions([])
    setShowBulkActions(false)
  }

  const applyDatePreset = (preset: string) => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    
    switch(preset) {
      case 'today':
        setDateFrom(today.toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(day - 1)
        setDateFrom(yesterday.toISOString().split('T')[0])
        setDateTo(yesterday.toISOString().split('T')[0])
        break
      case 'last7days':
        const weekAgo = new Date(today)
        weekAgo.setDate(day - 7)
        setDateFrom(weekAgo.toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'last30days':
        const monthAgo = new Date(today)
        monthAgo.setDate(day - 30)
        setDateFrom(monthAgo.toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'thismonth':
        setDateFrom(new Date(year, month, 1).toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'lastmonth':
        const lastMonth = new Date(year, month - 1, 1)
        const lastMonthEnd = new Date(year, month, 0)
        setDateFrom(lastMonth.toISOString().split('T')[0])
        setDateTo(lastMonthEnd.toISOString().split('T')[0])
        break
      case 'thisyear':
        setDateFrom(new Date(year, 0, 1).toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'all':
        setDateFrom('')
        setDateTo('')
        break
    }
  }

  const updateTransaction = (id: number, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))
  }

  const editTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction) {
      console.log('Edit transaction:', transaction)
    }
  }

  const deleteTransaction = (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id))
      setSelectedTransactions(prev => prev.filter(tid => tid !== id))
      if (selectedTransactions.length <= 1) {
        setShowBulkActions(false)
      }
    }
  }

  const sourceOptions = [...new Set(transactions.map(t => t.source))]

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Transactions</h2>
        <p className="text-gray-600 dark:text-gray-300">View and manage all your transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Date Preset */}
          <div>
            <select 
              value={datePreset} 
              onChange={(e) => {
                setDatePreset(e.target.value)
                applyDatePreset(e.target.value)
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Quick dates...</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thismonth">This month</option>
              <option value="lastmonth">Last month</option>
              <option value="thisyear">This year</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          {/* Date Range */}
          <div>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Unit */}
          <div>
            <select 
              value={selectedUnit} 
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Units</option>
              {unitOptions.map(unit => (
                <option key={unit.id} value={unit.name}>{unit.name}</option>
              ))}
            </select>
          </div>
          
          {/* Source */}
          <div>
            <select 
              value={selectedSource} 
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              {sourceOptions.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          
          {/* Category */}
          <div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="uncategorized">Uncategorized</option>
              <option value="Test Groceries">Test Groceries</option>
              <option value="Test Restaurants">Test Restaurants</option>
              <option value="Test Gas">Test Gas</option>
              <option value="Test Transportation">Test Transportation</option>
              <option value="Test Entertainment">Test Entertainment</option>
              <option value="Test Shopping">Test Shopping</option>
              <option value="Test Bills & Utilities">Test Bills & Utilities</option>
            </select>
          </div>
          
          {/* Amount Range */}
          <div className="flex space-x-2">
            <input 
              type="number" 
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="Min $"
              className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input 
              type="number" 
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="Max $"
              className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Show Ignored */}
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={showIgnored}
                onChange={(e) => setShowIgnored(e.target.checked)}
                className="mr-2"
              />
              Show ignored
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-300">
              {selectedTransactions.length} transactions selected
            </span>
            <div className="space-x-2">
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    bulkAssignUnit(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm"
              >
                <option value="">Bulk assign unit...</option>
                {unitOptions.map(unit => (
                  <option key={unit.id} value={unit.name}>{unit.name}</option>
                ))}
              </select>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    bulkCategorize(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm"
              >
                <option value="">Bulk categorize as...</option>
                <optgroup label="Food & Dining">
                  <option value="Test Groceries">└ Test Groceries</option>
                  <option value="Test Restaurants">└ Test Restaurants</option>
                </optgroup>
                <optgroup label="Transportation">
                  <option value="Test Transportation">Test Transportation (General)</option>
                  <option value="Test Gas">└ Test Gas</option>
                </optgroup>
                <option value="Test Entertainment">Test Entertainment</option>
                <option value="Test Shopping">Test Shopping</option>
                <option value="Test Bills & Utilities">Test Bills & Utilities</option>
              </select>
              <button 
                onClick={bulkIgnore}
                className="bg-gray-500 dark:bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 dark:hover:bg-gray-700 flex items-center"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Toggle Ignore
              </button>
              <button 
                onClick={() => {
                  setSelectedTransactions([])
                  setShowBulkActions(false)
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
        <div className="overflow-x-auto">
          <table className="min-w-full lg:w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    onClick={selectAll}
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    readOnly
                  />
                </th>
                <th 
                  onClick={() => toggleSort('date')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 min-w-[100px]"
                >
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Date
                    {sortBy === 'date' && (
                      <span className="ml-1">
                        {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                  <div className="flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    Source
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('description')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 min-w-[200px]"
                >
                  <div className="flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    Description
                    {sortBy === 'description' && (
                      <span className="ml-1">
                        {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[140px]">
                  <div className="flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    Source Category
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('amount')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 min-w-[100px]"
                >
                  <div className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Amount
                    {sortBy === 'amount' && (
                      <span className="ml-1">
                        {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                  <div className="flex items-center">
                    <Layers className="w-3 h-3 mr-1" />
                    Unit
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[140px]">
                  <div className="flex items-center">
                    <Tags className="w-3 h-3 mr-1" />
                    Category
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                  <div className="flex items-center">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Ignore
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                  <div className="flex items-center">
                    <StickyNote className="w-3 h-3 mr-1" />
                    Notes
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                  <div className="flex items-center">
                    <Settings className="w-3 h-3 mr-1" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className={transaction.ignore ? 'opacity-50 bg-gray-50 dark:bg-gray-700/50' : ''}
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => toggleTransaction(transaction.id)}
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.source}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.source_category}
                  </td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm font-semibold ${
                    transaction.amount > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <select 
                      value={transaction.unit}
                      onChange={(e) => updateTransaction(transaction.id, { unit: e.target.value })}
                      className={`border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-xs min-w-[100px] ${
                        !transaction.unit 
                          ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/30' 
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Not Set</option>
                      {unitOptions.map(unit => (
                        <option key={unit.id} value={unit.name}>{unit.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <select 
                      value={transaction.category || ''}
                      onChange={(e) => updateTransaction(transaction.id, { category: e.target.value || null })}
                      className={`border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-xs min-w-[120px] ${
                        !transaction.category 
                          ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/30' 
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Uncategorized</option>
                      <optgroup label="Food & Dining">
                        <option value="Test Groceries">└ Test Groceries</option>
                        <option value="Test Restaurants">└ Test Restaurants</option>
                      </optgroup>
                      <optgroup label="Transportation">
                        <option value="Test Transportation">Test Transportation (General)</option>
                        <option value="Test Gas">└ Test Gas</option>
                      </optgroup>
                      <option value="Test Entertainment">Test Entertainment</option>
                      <option value="Test Shopping">Test Shopping</option>
                      <option value="Test Bills & Utilities">Test Bills & Utilities</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <input 
                      type="checkbox" 
                      checked={transaction.ignore}
                      onChange={(e) => updateTransaction(transaction.id, { ignore: e.target.checked })}
                    />
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <input 
                      type="text" 
                      value={transaction.notes}
                      onChange={(e) => updateTransaction(transaction.id, { notes: e.target.value })}
                      placeholder="Add notes..."
                      className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded px-2 py-1 text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-3 text-sm whitespace-nowrap">
                    <div className="inline-flex rounded-md shadow-sm">
                      <button 
                        onClick={() => editTransaction(transaction.id)}
                        className="px-2 py-1.5 rounded-r-none border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteTransaction(transaction.id)}
                        className="px-2 py-1.5 rounded-l-none -ml-px border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
                        title="Delete transaction"
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
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  )
}