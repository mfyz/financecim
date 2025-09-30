import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ImportPage from '@/app/import/page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: any) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

// Mock FileReader
const mockFileReader = {
  readAsText: jest.fn(),
  onload: null,
  onerror: null,
  result: null,
}

global.FileReader = jest.fn(() => mockFileReader) as any

describe('ImportPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFileReader.readAsText.mockClear()
  })

  describe('Initial Render', () => {
    test('renders main heading and description', () => {
      render(<ImportPage />)

      expect(screen.getByText('Import Transactions')).toBeInTheDocument()
      expect(screen.getByText('Upload your CSV files to get started')).toBeInTheDocument()
    })

    test('renders upload section with drag & drop area', () => {
      render(<ImportPage />)

      expect(screen.getByText('Upload Your CSV Files')).toBeInTheDocument()
      expect(screen.getByText('Drag & drop your CSV files')).toBeInTheDocument()
      expect(screen.getByText('Choose Files')).toBeInTheDocument()
    })

    test('renders progress steps', () => {
      render(<ImportPage />)

      expect(screen.getByText('Upload')).toBeInTheDocument()
      expect(screen.getByText('Map Columns')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    test('renders CSV requirements section', () => {
      render(<ImportPage />)

      expect(screen.getByText('CSV File Requirements:')).toBeInTheDocument()
      expect(screen.getByText('Required Fields')).toBeInTheDocument()
      expect(screen.getByText('Multiple Files')).toBeInTheDocument()
      expect(screen.getByText('Date column (any common format)')).toBeInTheDocument()
      expect(screen.getByText('Description/memo column')).toBeInTheDocument()
      expect(screen.getByText('Amount column (positive/negative)')).toBeInTheDocument()
    })

    test('next button is disabled initially', () => {
      render(<ImportPage />)

      const nextButton = screen.getByRole('link', { name: /next: map columns/i })
      expect(nextButton).toHaveClass('cursor-not-allowed')
      expect(nextButton).toHaveClass('pointer-events-none')
    })
  })

  describe('File Upload', () => {
    test('handles file selection through browse button', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Test Transaction,-100.00'
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      // Mock FileReader behavior
      mockFileReader.result = csvContent

      fireEvent.change(fileInput)

      // Trigger FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Uploaded Files (1)')).toBeInTheDocument()
      })

      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    test('validates file types correctly', async () => {
      render(<ImportPage />)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File Validation Errors:')).toBeInTheDocument()
      })

      expect(screen.getByText(/Only CSV files are allowed/)).toBeInTheDocument()
    })

    test('validates file size limits', async () => {
      render(<ImportPage />)

      // Create a file larger than 50MB by mocking the size property
      const mockFile = new File(['content'], 'large.csv', { type: 'text/csv' })
      Object.defineProperty(mockFile, 'size', { value: 51 * 1024 * 1024 }) // 51MB

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File Validation Errors:')).toBeInTheDocument()
      })

      expect(screen.getByText(/File size exceeds 50MB limit/)).toBeInTheDocument()
    })
  })

  describe('Drag & Drop', () => {
    test('handles drag over events', async () => {
      render(<ImportPage />)

      const dropZone = screen.getByText('Drag & drop your CSV files').closest('div')
      expect(dropZone).toBeInTheDocument()

      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [],
        },
      })

      await waitFor(() => {
        expect(screen.getByText('Drop your files here!')).toBeInTheDocument()
      })
    })

    test('handles file drop', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Dropped File,-50.00'
      const mockFile = new File([csvContent], 'dropped.csv', { type: 'text/csv' })

      const dropZone = screen.getByText('Drag & drop your CSV files').closest('div')
      expect(dropZone).toBeInTheDocument()

      // Mock FileReader behavior
      mockFileReader.result = csvContent

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [mockFile],
        },
      })

      // Trigger FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Uploaded Files (1)')).toBeInTheDocument()
        expect(screen.getByText('dropped.csv')).toBeInTheDocument()
      })
    })

    test('shows visual feedback during drag operations', async () => {
      render(<ImportPage />)

      const dropZone = screen.getByText('Drag & drop your CSV files').closest('div')
      expect(dropZone).toBeInTheDocument()

      // Test drag enter
      fireEvent.dragEnter(dropZone!, {
        dataTransfer: { files: [] }
      })

      await waitFor(() => {
        expect(screen.getByText('Drop your files here!')).toBeInTheDocument()
      })

      // Test drag over maintains the state
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] }
      })

      expect(screen.getByText('Drop your files here!')).toBeInTheDocument()
    })
  })

  describe('Multiple Files', () => {
    test('displays multiple file count and merge indicator', async () => {
      render(<ImportPage />)

      const csvContent1 = 'Date,Description,Amount\n01/20/2024,File 1,-100.00'
      const csvContent2 = 'Date,Description,Amount\n01/21/2024,File 2,-200.00'
      const mockFile1 = new File([csvContent1], 'file1.csv', { type: 'text/csv' })
      const mockFile2 = new File([csvContent2], 'file2.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      // Upload first file
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile1],
        configurable: true,
      })

      mockFileReader.result = csvContent1
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent1 } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Uploaded Files (1)')).toBeInTheDocument()
      })

      // Upload second file
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile2],
        configurable: true,
      })

      mockFileReader.result = csvContent2
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent2 } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Uploaded Files (2)')).toBeInTheDocument()
        expect(screen.getByText('Multiple files will be merged')).toBeInTheDocument()
        expect(screen.getByText(/Total: .* rows from 2 files/)).toBeInTheDocument()
      })
    })

    test('can remove individual files', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Test,-100.00'
      const mockFile = new File([csvContent], 'removeme.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('removeme.csv')).toBeInTheDocument()
      })

      // Click remove button
      const removeButton = screen.getByTitle('Remove file')
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('removeme.csv')).not.toBeInTheDocument()
        expect(screen.queryByText('Uploaded Files')).not.toBeInTheDocument()
      })
    })
  })

  describe('CSV Parsing', () => {
    test('parses CSV with quoted fields correctly', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n"01/20/2024","Test, with comma","-100.00"'
      const mockFile = new File([csvContent], 'quoted.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('quoted.csv')).toBeInTheDocument()
        expect(screen.getByText('1 rows')).toBeInTheDocument()
      })
    })

    test('parses CSV with multi-line cells correctly', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Location\n12/31/2024,"AplPay TST* PLAZA","BROOKLYN\nNY"\n01/01/2025,"Test Store","NEW YORK\nNY"'
      const mockFile = new File([csvContent], 'multiline.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('multiline.csv')).toBeInTheDocument()
        // Should have 2 data rows (not 4 from splitting on newlines)
        expect(screen.getByText('2 rows')).toBeInTheDocument()
      })
    })

    test('parses CSV with escaped quotes (double quotes)', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,"He said ""Hello""",100.00'
      const mockFile = new File([csvContent], 'escaped.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('escaped.csv')).toBeInTheDocument()
        expect(screen.getByText('1 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV with Windows line endings (CRLF)', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\r\n01/20/2024,Test Transaction,-100.00\r\n01/21/2024,Another,-50.00'
      const mockFile = new File([csvContent], 'windows.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('windows.csv')).toBeInTheDocument()
        expect(screen.getByText('2 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV with empty rows gracefully', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Test,-100.00\n\n\n01/21/2024,Another,-50.00'
      const mockFile = new File([csvContent], 'empty-rows.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('empty-rows.csv')).toBeInTheDocument()
        // Should skip empty rows and have 2 data rows
        expect(screen.getByText('2 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV with complex multi-line cells (real-world example)', async () => {
      render(<ImportPage />)

      const csvContent = `Date,Description,Extended Details,Amount
12/31/2024,AplPay TST* PLAZA,"99999994366 3473651086
AplPay TST* PLAZA ORTEGA 300684874
BROOKLYN
NY
Description : RESTAURANTS Price : 0.9663
3473651086",96.63
01/01/2025,Test Store,"Line 1
Line 2
Line 3",50.00`

      const mockFile = new File([csvContent], 'complex.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('complex.csv')).toBeInTheDocument()
        // Should have 2 data rows despite multiple newlines in cells
        expect(screen.getByText('2 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV with trailing whitespace in cells', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,  Test Transaction  ,  -100.00  '
      const mockFile = new File([csvContent], 'whitespace.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('whitespace.csv')).toBeInTheDocument()
        expect(screen.getByText('1 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV without trailing newline', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Test,-100.00'
      const mockFile = new File([csvContent], 'no-trailing.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('no-trailing.csv')).toBeInTheDocument()
        expect(screen.getByText('1 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV with mixed quoted and unquoted fields', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,"Quoted Description",100.00\n01/21/2024,Unquoted Description,-50.00'
      const mockFile = new File([csvContent], 'mixed.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('mixed.csv')).toBeInTheDocument()
        expect(screen.getByText('2 rows')).toBeInTheDocument()
      })
    })

    test('handles CSV parsing errors gracefully', async () => {
      render(<ImportPage />)

      const mockFile = new File(['invalid content'], 'invalid.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      // Mock FileReader to throw an error
      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror(new Error('Parse error') as any)
          }
        }, 10)
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File Validation Errors:')).toBeInTheDocument()
      })

      expect(screen.getByText(/Failed to parse CSV file/)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    test('enables next button when files are uploaded and processed', async () => {
      render(<ImportPage />)

      const csvContent = 'Date,Description,Amount\n01/20/2024,Test,-100.00'
      const mockFile = new File([csvContent], 'complete.csv', { type: 'text/csv' })

      const fileInput = screen.getByText('Choose Files').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true,
      })

      mockFileReader.result = csvContent
      fireEvent.change(fileInput)
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('link', { name: /next: map columns/i })
      expect(nextButton).not.toHaveClass('cursor-not-allowed')
      expect(nextButton).not.toHaveClass('pointer-events-none')
    })

    test('renders import history link', () => {
      render(<ImportPage />)

      const historyLink = screen.getByRole('link', { name: /import history/i })
      expect(historyLink).toBeInTheDocument()
      expect(historyLink).toHaveAttribute('href', '/import/history')
    })
  })
})