import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CategoriesPage from '@/app/categories/page'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Modal and Confirm components to avoid portal issues
jest.mock('@/components/ui', () => ({
  Modal: ({ children, isOpen, title }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
      </div>
    )
  },
  Confirm: ({ isOpen, title, message }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="confirm-modal">
        <div>{title}</div>
        <div>{message}</div>
      </div>
    )
  },
}))

// Mock CategoryDropdown to avoid complex component interaction issues
jest.mock('@/components/forms/CategoryDropdown', () => ({
  CategoryDropdown: ({ value, onChange, label, placeholder }: any) => (
    <div>
      {label && <label>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || placeholder}
      >
        <option value="">None</option>
        <option value="1">Food & Dining</option>
        <option value="2">Groceries</option>
        <option value="3">Transportation</option>
      </select>
    </div>
  )
}))

// Mock FormField, FormSelect, and FormTextarea to simplify label association issues
jest.mock('@/components/forms', () => ({
  Form: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
  FormField: ({ label, value, onChange, placeholder, required, ...props }: any) => (
    <div>
      {label && <label>{label}{required && '*'}</label>}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        {...props}
      />
    </div>
  ),
  FormSelect: ({ label, value, onChange, options }: any) => (
    <div>
      {label && <label>{label}</label>}
      <select value={value} onChange={onChange} aria-label={label}>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
  FormTextarea: ({ label, value, onChange, placeholder, rows }: any) => (
    <div>
      {label && <label>{label}</label>}
      <textarea 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        rows={rows}
        aria-label={label}
      />
    </div>
  ),
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockCategories = [
  {
    id: 1,
    name: 'Food & Dining',
    parentCategoryId: null,
    color: '#10B981',
    icon: '🍔',
    monthlyBudget: 800,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: [
      {
        id: 2,
        name: 'Groceries',
        parentCategoryId: 1,
        color: '#10B981',
        icon: '🛒',
        monthlyBudget: 400,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        children: []
      }
    ]
  },
  {
    id: 3,
    name: 'Transportation',
    parentCategoryId: null,
    color: '#3B82F6',
    icon: '🚗',
    monthlyBudget: 500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: []
  }
]

const mockFlatCategories = [
  {
    id: 1,
    name: 'Food & Dining',
    parentCategoryId: null,
    color: '#10B981',
    icon: '🍔',
    monthlyBudget: 800,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Groceries',
    parentCategoryId: 1,
    color: '#10B981',
    icon: '🛒',
    monthlyBudget: 400,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Transportation',
    parentCategoryId: null,
    color: '#3B82F6',
    icon: '🚗',
    monthlyBudget: 500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

describe('Categories Page', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful API responses for all fetch calls
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    } as Response)
  })

  it('should render categories page with data', async () => {
    render(<CategoriesPage />)
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    })

    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Add Category')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  describe('Add Category Modal', () => {
    it('should open and close add modal', async () => {
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Add New Category')
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Icon (Single Emoji)')).toBeInTheDocument()
    })

    it('should handle emoji input correctly - single emoji', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      // Find icon input field
      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Test single emoji input
      await user.clear(iconInput)
      await user.type(iconInput, '🎯')
      
      expect(iconInput.value).toBe('🎯')
    })

    it('should handle emoji input correctly - multiple emojis should keep only first', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      // Find icon input field
      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Test multiple emojis - should keep only first
      await user.clear(iconInput)
      await user.type(iconInput, '🎯🚀💰')
      
      expect(iconInput.value).toBe('🎯')
    })

    it('should handle emoji input correctly - complex emojis', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Test multi-byte emoji that should stay intact
      await user.clear(iconInput)
      await user.type(iconInput, '🤔') // Thinking face (multi-byte but single grapheme)
      
      expect(iconInput.value).toBe('🤔')
    })

    it('should handle emoji input correctly - empty input', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Test empty input
      await user.clear(iconInput)
      
      expect(iconInput.value).toBe('')
    })

    it('should handle emoji input correctly - regular text should keep only first character', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Test regular text - should keep only first character
      await user.clear(iconInput)
      await user.type(iconInput, 'ABC')
      
      expect(iconInput.value).toBe('A')
    })

    it('should submit add form with emoji', async () => {
      const user = userEvent.setup()
      
      // Mock successful creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFlatCategories),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 4,
            name: 'New Category',
            parentCategoryId: null,
            color: '#FF0000',
            icon: '🎯',
            monthlyBudget: 100,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockCategories]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockFlatCategories]),
        } as Response)

      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      // Fill form using aria-label since we mocked FormField
      const nameInput = screen.getByLabelText('Name')
      const iconInput = screen.getByLabelText('Icon (Single Emoji)')
      
      await user.type(nameInput, 'New Category')
      await user.type(iconInput, '🎯')
      
      // Submit form - find the button by its text
      const buttons = screen.getAllByText('Add Category')
      const submitButton = buttons[buttons.length - 1] // Get the last one (form button)
      fireEvent.click(submitButton)

      // Verify API was called with correct data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Category',
            parentCategoryId: null,
            color: '#3B82F6',
            icon: '🎯',
            monthlyBudget: null
          })
        })
      })
    })
  })

  describe('Edit Category Modal', () => {
    it('should open edit modal with existing data', async () => {
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Click edit button for first category
      const editButtons = screen.getAllByTitle('Edit category')
      fireEvent.click(editButtons[0])

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Category')
      
      // Check that form is pre-filled
      const nameInput = screen.getByDisplayValue('Food & Dining')
      const iconInput = screen.getByDisplayValue('🍔')
      
      expect(nameInput).toBeInTheDocument()
      expect(iconInput).toBeInTheDocument()
    })

    it('should handle emoji editing correctly', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('Edit category')
      fireEvent.click(editButtons[0])

      // Wait for modal to open and find the icon input
      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Category')
      })
      
      // Find the icon input by aria-label
      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement
      
      // Initial value should be the burger emoji
      expect(iconInput.value).toBe('🍔')
      
      // Change emoji
      await user.clear(iconInput)
      await user.type(iconInput, '🎯🚀') // Should keep only first emoji
      
      // Verify only first emoji is kept
      expect(iconInput.value).toBe('🎯')
    })

    it('should handle edit form submission with emoji', async () => {
      const user = userEvent.setup()
      
      // Mock successful update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFlatCategories),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockCategories[0],
            name: 'Updated Category',
            icon: '🎯',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockCategories]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockFlatCategories]),
        } as Response)

      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('Edit category')
      fireEvent.click(editButtons[0])

      // Update form
      const nameInput = screen.getByDisplayValue('Food & Dining')
      const iconInput = screen.getByDisplayValue('🍔')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Category')
      await user.clear(iconInput)
      await user.type(iconInput, '🎯')
      
      // Submit form
      const updateButton = screen.getByRole('button', { name: /update category/i })
      fireEvent.click(updateButton)

      // Verify API was called with correct data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/categories/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Category',
            parentCategoryId: null,
            color: '#10B981',
            icon: '🎯',
            monthlyBudget: 800
          })
        })
      })
    })
  })

  describe('Emoji Validation Function', () => {
    it('should handle various emoji scenarios correctly', async () => {
      const user = userEvent.setup()
      render(<CategoriesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })

      // Open add modal to test emoji input
      const addButton = screen.getByText('Add Category')
      fireEvent.click(addButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Add New Category')
      })

      // Find icon input using aria-label
      const iconInput = screen.getByLabelText('Icon (Single Emoji)') as HTMLInputElement

      // Test scenarios
      const testCases = [
        { input: '🎯', expected: '🎯', description: 'single emoji' },
        { input: '🎯🚀💰', expected: '🎯', description: 'multiple emojis' },
        { input: '🤔', expected: '🤔', description: 'multi-byte emoji' },
        { input: 'A', expected: 'A', description: 'single character' },
        { input: 'ABC', expected: 'A', description: 'multiple characters' },
        { input: '123', expected: '1', description: 'numbers' },
        { input: '!@#', expected: '!', description: 'special characters' },
      ]

      for (const testCase of testCases) {
        // Clear the input first
        await user.clear(iconInput)
        
        // Type the test input
        if (testCase.input) {
          await user.type(iconInput, testCase.input)
        }
        
        // Check the result
        expect(iconInput.value).toBe(testCase.expected)
      }
    })
  })
})