'use client'

import { useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface ImportHistoryItem {
  id: number
  date: string
  fileName: string
  rowsImported: number
  source: string
  status: 'completed' | 'failed'
}

const mockImportHistory: ImportHistoryItem[] = [
  { 
    id: 1, 
    date: '2024-01-15 09:30 AM', 
    fileName: 'test_chase_transactions_jan.csv', 
    rowsImported: 247, 
    source: 'Test Chase Bank',
    status: 'completed'
  },
  { 
    id: 2, 
    date: '2024-01-10 02:15 PM', 
    fileName: 'test_amex_statement_dec.csv', 
    rowsImported: 189, 
    source: 'Test American Express',
    status: 'completed'
  },
  { 
    id: 3, 
    date: '2024-01-08 11:45 AM', 
    fileName: 'test_bofa_export_dec.csv', 
    rowsImported: 312, 
    source: 'Test Bank of America',
    status: 'completed'
  },
  { 
    id: 4, 
    date: '2024-01-05 04:20 PM', 
    fileName: 'test_chase_transactions_dec.csv', 
    rowsImported: 298, 
    source: 'Test Chase Bank',
    status: 'completed'
  },
  { 
    id: 5, 
    date: '2024-01-02 10:00 AM', 
    fileName: 'test_wells_fargo_dec.csv', 
    rowsImported: 156, 
    source: 'Test Wells Fargo',
    status: 'completed'
  },
  { 
    id: 6, 
    date: '2023-12-28 03:30 PM', 
    fileName: 'test_chase_credit_dec.csv', 
    rowsImported: 0, 
    source: 'Test Chase Credit Card',
    status: 'failed'
  },
  { 
    id: 7, 
    date: '2023-12-20 09:15 AM', 
    fileName: 'test_amex_statement_nov.csv', 
    rowsImported: 203, 
    source: 'Test American Express',
    status: 'completed'
  },
  { 
    id: 8, 
    date: '2023-12-15 01:45 PM', 
    fileName: 'test_bofa_export_nov.csv', 
    rowsImported: 278, 
    source: 'Test Bank of America',
    status: 'completed'
  },
  { 
    id: 9, 
    date: '2023-12-10 11:30 AM', 
    fileName: 'test_chase_transactions_nov.csv', 
    rowsImported: 334, 
    source: 'Test Chase Bank',
    status: 'completed'
  },
  { 
    id: 10, 
    date: '2023-12-05 02:00 PM', 
    fileName: 'test_wells_fargo_nov.csv', 
    rowsImported: 145, 
    source: 'Test Wells Fargo',
    status: 'completed'
  },
  { 
    id: 11, 
    date: '2023-12-01 08:45 AM', 
    fileName: 'test_discover_card_nov.csv', 
    rowsImported: 78, 
    source: 'Test Discover Card',
    status: 'completed'
  },
  { 
    id: 12, 
    date: '2023-11-28 03:20 PM', 
    fileName: 'test_chase_business_nov.csv', 
    rowsImported: 456, 
    source: 'Test Chase Business',
    status: 'completed'
  },
  { 
    id: 13, 
    date: '2023-11-25 11:00 AM', 
    fileName: 'test_capital_one_oct.csv', 
    rowsImported: 234, 
    source: 'Test Capital One',
    status: 'completed'
  },
  { 
    id: 14, 
    date: '2023-11-20 09:30 AM', 
    fileName: 'test_citi_credit_oct.csv', 
    rowsImported: 0, 
    source: 'Test Citi Credit Card',
    status: 'failed'
  },
  { 
    id: 15, 
    date: '2023-11-15 01:15 PM', 
    fileName: 'test_paypal_transactions_oct.csv', 
    rowsImported: 89, 
    source: 'Test PayPal',
    status: 'completed'
  },
  { 
    id: 16, 
    date: '2023-11-10 10:45 AM', 
    fileName: 'test_venmo_history_oct.csv', 
    rowsImported: 23, 
    source: 'Test Venmo',
    status: 'completed'
  },
  { 
    id: 17, 
    date: '2023-11-05 04:30 PM', 
    fileName: 'test_chase_savings_oct.csv', 
    rowsImported: 34, 
    source: 'Test Chase Savings',
    status: 'completed'
  },
  { 
    id: 18, 
    date: '2023-11-01 08:20 AM', 
    fileName: 'test_ally_bank_oct.csv', 
    rowsImported: 67, 
    source: 'Test Ally Bank',
    status: 'completed'
  },
  { 
    id: 19, 
    date: '2023-10-28 02:45 PM', 
    fileName: 'test_usbank_checking_sep.csv', 
    rowsImported: 178, 
    source: 'Test US Bank',
    status: 'completed'
  },
  { 
    id: 20, 
    date: '2023-10-25 12:15 PM', 
    fileName: 'test_amex_gold_sep.csv', 
    rowsImported: 145, 
    source: 'Test American Express Gold',
    status: 'completed'
  }
]

export default function ImportHistoryPage() {
  const [importHistory] = useState<ImportHistoryItem[]>(mockImportHistory)

  return (
    <div className="py-8">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/import" 
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Import History</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {importHistory.length} imports
        </div>
      </div>

      {/* Import History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Import Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rows Imported
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {importHistory.map((importItem) => (
              <tr key={importItem.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {importItem.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    {importItem.fileName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {importItem.rowsImported.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {importItem.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      importItem.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    }`}
                  >
                    {importItem.status === 'completed' ? 'Completed' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}