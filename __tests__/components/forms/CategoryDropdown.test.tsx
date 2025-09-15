import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CategoryDropdown } from '@/components/forms/CategoryDropdown'

// Mock fetch
global.fetch = jest.fn()

describe('CategoryDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    })
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