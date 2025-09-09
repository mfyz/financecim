'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Building2, FileText, Tag, DollarSign, Layers, Tags, EyeOff, StickyNote, Settings, Edit2, Trash2, ChevronDown, ChevronUp, X, Plus, RefreshCw } from 'lucide-react'
import { TransactionWithRelations } from '@/db/models/transactions.model'
import { CategoryDropdown } from '@/components/forms'

interface Unit {
  id: number
  name: string
  color: string
  active?: boolean
}

interface Source {
  id: number
  name: string
  type: string
}


interface TransactionsResponse {
  data: TransactionWithRelations[]
  total: number
  totalPages: number
}

interface TransactionStats {
  totalTransactions: number
  totalIncome: number
  totalExpenses: number
  averageTransaction: number
  categorizedCount: number
  uncategorizedCount: number
  ignoredCount: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [tags, setTags] = useState<string[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [limit] = useState(50)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showIgnored, setShowIgnored] = useState<boolean | undefined>(false)
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Sort states
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description' | 'created_at'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch initial data
  useEffect(() => {
    fetchUnits()
    fetchSources()
    fetchTags()
  }, [])

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions()
  }, [currentPage, sortBy, sortOrder, searchTerm, selectedUnit, selectedSource, selectedCategory, dateFrom, dateTo, amountMin, amountMax, showIgnored, selectedTags])

  // Fetch stats when filters change
  useEffect(() => {
    fetchStats()
  }, [searchTerm, selectedUnit, selectedSource, selectedCategory, dateFrom, dateTo, amountMin, amountMax, selectedTags])

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      const result = await response.json()
      const data = result.data || result // Handle both response formats
      setUnits(Array.isArray(data) ? data.filter((unit: Unit) => unit.active) : [])
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources')
      const result = await response.json()
      const data = result.data || result // Handle both response formats
      setSources(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching sources:', error)
    }
  }


  const fetchTags = async () => {
    try {
      const response = await fetch('/api/transactions/tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    
    params.set('page', currentPage.toString())
    params.set('limit', limit.toString())
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    
    if (searchTerm) params.set('search', searchTerm)
    if (selectedUnit !== 'all') params.set('unitId', selectedUnit)
    if (selectedSource !== 'all') params.set('sourceId', selectedSource)
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        // Handle uncategorized filter on frontend
      } else {
        params.set('categoryId', selectedCategory)
      }
    }
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (amountMin) params.set('amountMin', amountMin)
    if (amountMax) params.set('amountMax', amountMax)
    if (showIgnored !== undefined) params.set('showIgnored', showIgnored.toString())
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    
    return params
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = buildQueryParams()
      const response = await fetch(`/api/transactions?${params}`)
      const data: TransactionsResponse = await response.json()
      
      // Handle uncategorized filter on frontend if needed
      let filteredData = data.data
      if (selectedCategory === 'uncategorized') {
        filteredData = data.data.filter(t => !t.categoryId)
      }
      
      setTransactions(filteredData)
      setTotalPages(data.totalPages)
      setTotalTransactions(data.total)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (selectedUnit !== 'all') params.set('unitId', selectedUnit)
      if (selectedSource !== 'all') params.set('sourceId', selectedSource)
      if (selectedCategory !== 'all' && selectedCategory !== 'uncategorized') params.set('categoryId', selectedCategory)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (amountMin) params.set('amountMin', amountMin)
      if (amountMax) params.set('amountMax', amountMax)
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
      
      const response = await fetch(`/api/transactions/stats?${params}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const toggleSort = (field: 'date' | 'amount' | 'description' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
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
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([])
      setShowBulkActions(false)
    } else {
      setSelectedTransactions(transactions.map(t => t.id))
      setShowBulkActions(true)
    }
  }

  const bulkUpdate = async (updateData: { unitId?: number; categoryId?: number; ignore?: boolean; notes?: string }) => {
    if (selectedTransactions.length === 0) return

    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedTransactions,
          data: updateData
        })
      })

      if (response.ok) {
        await fetchTransactions()
        await fetchStats()
        setSelectedTransactions([])
        setShowBulkActions(false)
      } else {
        console.error('Bulk update failed')
      }
    } catch (error) {
      console.error('Error performing bulk update:', error)
    }
  }

  const bulkDelete = async () => {
    if (selectedTransactions.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedTransactions.length} transaction${selectedTransactions.length === 1 ? '' : 's'}?`)) return

    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTransactions })
      })

      if (response.ok) {
        await fetchTransactions()
        await fetchStats()
        setSelectedTransactions([])
        setShowBulkActions(false)
      } else {
        console.error('Bulk delete failed')
      }
    } catch (error) {
      console.error('Error performing bulk delete:', error)
    }
  }

  const updateTransaction = async (id: number, updates: { unitId?: number; categoryId?: number; ignore?: boolean; notes?: string }) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchTransactions()
        await fetchStats()
      } else {
        console.error('Update failed')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }

  const deleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTransactions()
        await fetchStats()
        setSelectedTransactions(prev => prev.filter(tid => tid !== id))
        if (selectedTransactions.length <= 1) {
          setShowBulkActions(false)
        }
      } else {
        console.error('Delete failed')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
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
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setDatePreset('')
    setSelectedSource('all')
    setSelectedCategory('all')
    setAmountMin('')
    setAmountMax('')
    setShowIgnored(false)
    setSelectedUnit('all')
    setSelectedTags([])
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }


  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Transactions</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {stats && `${stats.totalTransactions.toLocaleString()} transactions • ${formatCurrency(stats.totalIncome)} income • ${formatCurrency(stats.totalExpenses)} expenses`}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={clearFilters}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </button>
          <button 
            onClick={fetchTransactions}
            disabled={loading}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
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
              onChange={(e) => {
                setDateFrom(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Unit */}
          <div>
            <select 
              value={selectedUnit} 
              onChange={(e) => {
                setSelectedUnit(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Units</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id.toString()}>{unit.name}</option>
              ))}
            </select>
          </div>
          
          {/* Source */}
          <div>
            <select 
              value={selectedSource} 
              onChange={(e) => {
                setSelectedSource(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              {sources.map(source => (
                <option key={source.id} value={source.id.toString()}>{source.name}</option>
              ))}
            </select>
          </div>
          
          {/* Category */}
          <div>
            <CategoryDropdown
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value)
                setCurrentPage(1)
              }}
              includeEmpty={false}
              includeAll={true}
              includeUncategorized={true}
              className="text-sm"
            />
          </div>
          
          {/* Amount Range */}
          <div className="flex space-x-2">
            <input 
              type="number" 
              value={amountMin}
              onChange={(e) => {
                setAmountMin(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Min $"
              className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input 
              type="number" 
              value={amountMax}
              onChange={(e) => {
                setAmountMax(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Max $"
              className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Show Ignored */}
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={showIgnored === true}
                onChange={(e) => {
                  setShowIgnored(e.target.checked ? true : false)
                  setCurrentPage(1)
                }}
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
                    bulkUpdate({ unitId: parseInt(e.target.value) })
                    e.target.value = ''
                  }
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm"
              >
                <option value="">Bulk assign unit...</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
              <div className="inline-block">
                <CategoryDropdown
                  value=""
                  onChange={(value) => {
                    if (value) {
                      bulkUpdate({ categoryId: parseInt(value) })
                    }
                  }}
                  includeEmpty={true}
                  emptyLabel="Bulk categorize as..."
                  includeAll={false}
                  includeUncategorized={false}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm"
                />
              </div>
              <button 
                onClick={() => bulkUpdate({ ignore: true })}
                className="bg-gray-500 dark:bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 dark:hover:bg-gray-700 flex items-center"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Ignore
              </button>
              <button 
                onClick={bulkDelete}
                className="bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
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
        {loading && (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
          </div>
        )}
        
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full lg:w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      onClick={selectAll}
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
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
                {transactions.map((transaction) => (
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
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.source.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.sourceCategory || '-'}
                    </td>
                    <td className={`px-6 py-3 whitespace-nowrap text-sm font-semibold ${
                      transaction.amount > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <select 
                        value={transaction.unitId || ''}
                        onChange={(e) => updateTransaction(transaction.id, { unitId: e.target.value ? parseInt(e.target.value) : undefined })}
                        className={`border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-xs min-w-[100px] ${
                          !transaction.unitId 
                            ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/30' 
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Not Set</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <CategoryDropdown
                        value={transaction.categoryId?.toString() || ''}
                        onChange={(value) => updateTransaction(transaction.id, { categoryId: value ? parseInt(value) : undefined })}
                        includeEmpty={true}
                        emptyLabel="Uncategorized"
                        includeAll={false}
                        includeUncategorized={false}
                        className={`text-xs min-w-[120px] ${
                          !transaction.categoryId 
                            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/30' 
                            : ''
                        }`}
                      />
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <input 
                        type="checkbox" 
                        checked={transaction.ignore || false}
                        onChange={(e) => updateTransaction(transaction.id, { ignore: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <input 
                        type="text" 
                        value={transaction.notes || ''}
                        onChange={(e) => updateTransaction(transaction.id, { notes: e.target.value })}
                        placeholder="Add notes..."
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded px-2 py-1 text-xs w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      <div className="inline-flex rounded-md shadow-sm">
                        <button 
                          onClick={() => deleteTransaction(transaction.id)}
                          className="px-2 py-1.5 border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 border-gray-300 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors rounded"
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
        )}
        
        {!loading && transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing page {currentPage} of {totalPages} ({totalTransactions.toLocaleString()} total)
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && stats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-gray-500 dark:text-gray-400">Categorized</div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {stats.categorizedCount} ({Math.round((stats.categorizedCount / (stats.totalTransactions || 1)) * 100)}%)
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-gray-500 dark:text-gray-400">Uncategorized</div>
            <div className="font-semibold text-red-600 dark:text-red-400">
              {stats.uncategorizedCount} ({Math.round((stats.uncategorizedCount / (stats.totalTransactions || 1)) * 100)}%)
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-gray-500 dark:text-gray-400">Ignored</div>
            <div className="font-semibold text-gray-600 dark:text-gray-400">
              {stats.ignoredCount}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-gray-500 dark:text-gray-400">Average</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.averageTransaction)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}