'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, FileText, X, Check, ArrowRight, History } from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  name: string
  size: string
  sizeBytes: number
  rows: number
  status: 'processing' | 'completed'
  preview: string[][]
}

interface ValidationError {
  file: string
  errors: string[]
}

export default function ImportPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    const errors: string[] = []
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    // Check file size
    if (file.size > maxSize) {
      errors.push('File size exceeds 50MB limit')
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('Only CSV files are allowed')
    }
    
    // Check file name
    if (file.name.length > 100) {
      errors.push('File name is too long')
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  const parseCSVFile = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          const data = lines.map(line => {
            // Simple CSV parsing - handles basic quotes and commas
            const result = []
            let current = ''
            let inQuotes = false

            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true
              } else if (char === '"' && inQuotes) {
                inQuotes = false
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          })
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const generateFilePreview = (csvData: string[][]): string[][] => {
    // Skip header row and return first 5 data rows
    return csvData.slice(1, 6)
  }

  const processFileData = useCallback(async (file: File, fileData: UploadedFile) => {
    setUploadingFile(fileData.name)
    setUploadProgress(0)

    try {
      // Simulate processing with progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20 + 10
          return Math.min(newProgress, 90)
        })
      }, 100)

      // Parse the actual CSV file
      const csvData = await parseCSVFile(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Complete processing
      setTimeout(() => {
        fileData.status = 'completed'
        fileData.rows = csvData.length - 1 // Subtract header row
        fileData.preview = generateFilePreview(csvData)
        setUploadingFile(null)
        setUploadProgress(0)
        setUploadedFiles(prev => [...prev])
      }, 500)

    } catch (error) {
      setValidationErrors(prev => [...prev, {
        file: file.name,
        errors: ['Failed to parse CSV file. Please check the format.']
      }])
      setUploadingFile(null)
      setUploadProgress(0)
      // Remove failed file from uploaded files
      setUploadedFiles(prev => prev.filter(f => f.name !== file.name))
    }
  }, [])

  const processFiles = useCallback((files: FileList) => {
    setValidationErrors([])
    const newFiles: UploadedFile[] = []
    const errors: ValidationError[] = []

    Array.from(files).forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        const fileData: UploadedFile = {
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          rows: 0, // Will be updated after parsing
          status: 'processing',
          preview: []
        }

        processFileData(file, fileData)
        newFiles.push(fileData)
      } else {
        errors.push({
          file: file.name,
          errors: validation.errors
        })
      }
    })

    setUploadedFiles(prev => [...prev, ...newFiles])
    setValidationErrors(errors)
  }, [processFileData])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      processFiles(files)
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const canProceedToStep2 = () => {
    return uploadedFiles.length > 0 &&
           uploadedFiles.every(f => f.status === 'completed')
  }

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    // Only set dragOver to false if we're leaving the dropzone completely
    if (event.currentTarget === event.target) {
      setDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Import Transactions</h2>
            <p className="text-gray-600 dark:text-gray-300">Upload your CSV files to get started</p>
          </div>
          <Link 
            href="/import/history" 
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center border border-gray-300 dark:border-gray-600"
          >
            <History className="w-4 h-4 mr-2" />
            Import History
          </Link>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mt-6 mb-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 text-white shadow-lg">1</div>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Upload</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <Link href="/import/step2" className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">2</Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Map Columns</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <Link href="/import/step3" className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">3</Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Preview</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400">4</div>
              <div className="ml-2">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: CSV Upload Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Upload Your CSV Files</h3>
          <p className="text-gray-600 dark:text-gray-400">Upload one or more CSV files containing your transaction data. Files will be automatically merged into a single dataset.</p>
        </div>

        {/* File Upload Area */}
        <div className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01] shadow-lg'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
          >
            <div className="flex flex-col items-center">
              <UploadCloud className={`w-16 h-16 mb-4 transition-colors ${
                dragOver
                  ? 'text-blue-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />

              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {dragOver ? 'Drop your files here!' : 'Drag & drop your CSV files'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">or</p>

              <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center">
                <span>Choose Files</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".csv"
                  className="hidden"
                />
              </label>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Supports multiple CSV files • Max 50MB per file
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadingFile && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Processing: {uploadingFile}
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-400">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">File Validation Errors:</h4>
              {validationErrors.map((error, index) => (
                <div key={index} className="mb-2">
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">{error.file}</div>
                  {error.errors.map((errorMsg, errorIndex) => (
                    <div key={errorIndex} className="text-sm text-red-600 dark:text-red-300 ml-4">
                      • {errorMsg}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              {uploadedFiles.length > 1 && (
                <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  Multiple files will be merged
                </div>
              )}
            </div>

            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span>{file.size}</span> •
                          <span> {file.rows.toLocaleString()} rows</span> •
                          <span className={
                            file.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }>
                            {file.status === 'completed' ? 'Ready' : 'Processing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File Preview */}
                  {file.status === 'completed' && file.preview.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Data:</div>
                      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-600 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y dark:divide-gray-600">
                            <tbody>
                              {file.preview.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex} className="text-sm">
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-1 text-gray-900 dark:text-white whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {file.preview.length > 3 && (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-400 text-center">
                            ... and {(file.rows - 3).toLocaleString()} more rows
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Summary */}
            {uploadedFiles.length > 1 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Total: {uploadedFiles.reduce((sum, file) => sum + file.rows, 0).toLocaleString()} rows from {uploadedFiles.length} files
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  All files will be combined into a single dataset for processing
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requirements Info */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">CSV File Requirements:</h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Required Fields</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Date column (any common format)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Description/memo column</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Amount column (positive/negative)</span>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Multiple Files</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span>Files will be automatically merged</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span>Column mapping applied to all files</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span>Duplicates detected and flagged</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Optional fields:</strong> Category, Account, Balance, Reference Number
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center">
          <Link
            href={canProceedToStep2() ? '/import/step2' : '#'}
            className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center ${
              canProceedToStep2() 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed pointer-events-none'
            }`}
          >
            <span>Next: Map Columns</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}