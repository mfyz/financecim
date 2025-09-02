'use client'

import { DataTable, Column } from './data-table'

export interface Transaction extends Record<string, unknown> {
  id: string
  date: string
  description: string
  amount: number
  category: string
  source: string
  status: 'completed' | 'pending' | 'failed'
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onRowClick?: (transaction: Transaction) => void
}

export function TransactionsTable({ transactions, onRowClick }: TransactionsTableProps) {
  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (transaction) => (
        <span className="text-gray-900 dark:text-white">
          {new Date(transaction.date).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      filterable: true,
      render: (transaction) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {transaction.description}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      className: 'text-right',
      render: (transaction) => (
        <span className={`font-medium ${
          transaction.amount >= 0 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      filterable: true,
      render: (transaction) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {transaction.category}
        </span>
      )
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      filterable: true,
      render: (transaction) => (
        <span className="text-gray-600 dark:text-gray-400">
          {transaction.source}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (transaction) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          transaction.status === 'completed'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : transaction.status === 'pending'
            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {transaction.status}
        </span>
      )
    }
  ]

  return (
    <DataTable
      data={transactions}
      columns={columns}
      onRowClick={onRowClick}
      searchable
      filterable
      pagination
      pageSize={20}
    />
  )
}