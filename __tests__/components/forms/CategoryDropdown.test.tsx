import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CategoryDropdown } from '@/components/forms/CategoryDropdown'

// Store original console.error
const originalError = console.error

// Set up global spy for React act() warnings - this runs at module load time
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
  // Suppress React act() warnings only
  if (typeof message === 'string' && message.includes('not wrapped in act')) {
    return
  }
  originalError(message, ...args)
})

// Mock fetch
global.fetch = jest.fn()

describe('CategoryDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    })
    // Don't clear the console.error mock - we want it to persist
  })

  afterAll(() => {
    // Restore console.error after all tests
    consoleErrorSpy.mockRestore()
  })

  test('renders without crashing', async () => {
    render(
      <CategoryDropdown
        value=""
        onChange={jest.fn()}
        placeholder="Select category..."
      />
    )

    // Wait for loading to complete and check for "None" (default empty label)
    await screen.findByText('None')

    expect(screen.getByText('None')).toBeInTheDocument()
  })

  test('handles loading state', () => {
    render(
      <CategoryDropdown
        value=""
        onChange={jest.fn()}
        placeholder="Select category..."
      />
    )

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
  })
})