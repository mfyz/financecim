'use client'

import Link from 'next/link'
import { Upload, ArrowRight, History, FileText, Eye, CheckCircle } from 'lucide-react'

export default function ImportOverviewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Import System Overview</h2>
        <p className="text-gray-600 dark:text-gray-300">Quick access to all import functionality for testing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Import */}
        <Link
          href="/import"
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Upload className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Main Import</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Start the import process - upload CSV files and select data sources
          </p>
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <span>Start Import</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </Link>

        {/* Step 2 - Column Mapping */}
        <Link
          href="/import/step2"
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-green-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Column Mapping</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Map CSV columns to transaction fields with auto-detection and templates
          </p>
          <div className="flex items-center text-green-600 dark:text-green-400">
            <span>View Step 2</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </Link>

        {/* Step 3 - Preview */}
        <Link
          href="/import/step3"
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Eye className="w-8 h-8 text-purple-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Data Preview</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Preview imported data with validation, filtering, and error checking
          </p>
          <div className="flex items-center text-purple-600 dark:text-purple-400">
            <span>View Step 3</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </Link>

        {/* Import History */}
        <Link
          href="/import/history"
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <History className="w-8 h-8 text-orange-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Import History</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            View all previous imports with status, file names, and row counts
          </p>
          <div className="flex items-center text-orange-600 dark:text-orange-400">
            <span>View History</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </Link>

        {/* Complete Flow */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-dashed border-blue-300 dark:border-blue-600">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Complete Flow</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Test the complete import workflow: Upload → Map → Preview → Complete
          </p>
          <div className="space-y-2">
            <Link href="/import" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              1. Upload Files
            </Link>
            <Link href="/import/step2" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              2. Map Columns
            </Link>
            <Link href="/import/step3" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              3. Preview Data
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Features Implemented</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Drag & drop file uploads
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Auto column detection
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Mapping templates
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Data validation
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Error highlighting
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Auto categorization
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Import history
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Clickable step navigation
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}