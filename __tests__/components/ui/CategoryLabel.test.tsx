import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CategoryLabel, CategoryTextLabel } from '@/components/ui/CategoryLabel'

describe('CategoryLabel Component', () => {
  const mockCategory = {
    id: 1,
    name: 'Groceries',
    parentCategoryId: null,
    color: '#3B82F6',
    icon: '🛒',
    monthlyBudget: 500,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }

  describe('Basic Rendering', () => {
    test('renders category name correctly', () => {
      render(<CategoryLabel category={mockCategory} />)
      expect(screen.getByText('Groceries')).toBeInTheDocument()
    })

    test('renders "Uncategorized" when category is null', () => {
      render(<CategoryLabel category={null} />)
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })

    test('renders "Uncategorized" when category is undefined', () => {
      render(<CategoryLabel category={undefined} />)
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })

    test('renders icon when showIcon is true', () => {
      render(<CategoryLabel category={mockCategory} showIcon={true} />)
      expect(screen.getByText('🛒')).toBeInTheDocument()
    })

    test('does not render icon when showIcon is false', () => {
      render(<CategoryLabel category={mockCategory} showIcon={false} />)
      expect(screen.queryByText('🛒')).not.toBeInTheDocument()
    })

    test('does not render icon when category has no icon', () => {
      const categoryWithoutIcon = { ...mockCategory, icon: null }
      render(<CategoryLabel category={categoryWithoutIcon} showIcon={true} />)
      expect(screen.queryByText('🛒')).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    test('applies small size classes', () => {
      const { container } = render(<CategoryLabel category={mockCategory} size="sm" />)
      const element = container.querySelector('.text-xs')
      expect(element).toBeInTheDocument()
    })

    test('applies medium size classes by default', () => {
      const { container } = render(<CategoryLabel category={mockCategory} />)
      const element = container.querySelector('.text-sm')
      expect(element).toBeInTheDocument()
    })

    test('applies large size classes', () => {
      const { container } = render(<CategoryLabel category={mockCategory} size="lg" />)
      const element = container.querySelector('.text-base')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Color Handling', () => {
    test('applies background color when showColor is true', () => {
      const { container } = render(<CategoryLabel category={mockCategory} showColor={true} />)
      const element = container.querySelector('div')
      expect(element).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    test('does not apply background color when showColor is false', () => {
      const { container } = render(<CategoryLabel category={mockCategory} showColor={false} />)
      const element = container.querySelector('div')
      expect(element).toHaveStyle({ backgroundColor: '#f3f4f6' })
    })

    test('applies white text for dark backgrounds', () => {
      const darkCategory = { ...mockCategory, color: '#1F2937' }
      const { container } = render(<CategoryLabel category={darkCategory} showColor={true} />)
      const element = container.querySelector('.text-white')
      expect(element).toBeInTheDocument()
    })

    test('applies dark text for light backgrounds', () => {
      const lightCategory = { ...mockCategory, color: '#F3F4F6' }
      const { container } = render(<CategoryLabel category={lightCategory} showColor={true} />)
      const element = container.querySelector('.text-gray-900')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Badge Variant', () => {
    test('renders badge variant by default', () => {
      const { container } = render(<CategoryLabel category={mockCategory} />)
      const element = container.querySelector('.rounded-full')
      expect(element).toBeInTheDocument()
    })

    test('renders badge variant explicitly', () => {
      const { container } = render(<CategoryLabel category={mockCategory} variant="badge" />)
      const element = container.querySelector('.rounded-full')
      expect(element).toBeInTheDocument()
    })

    test('applies custom className to badge variant', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="badge" className="custom-class" />
      )
      const element = container.querySelector('.custom-class')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Inline Variant', () => {
    test('renders inline variant with color', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="inline" showColor={true} />
      )
      const element = container.querySelector('.inline-flex')
      expect(element).toBeInTheDocument()
      expect(element).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    test('renders inline variant without color', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="inline" showColor={false} />
      )
      const element = container.querySelector('.inline-flex')
      expect(element).toBeInTheDocument()
      expect(element).not.toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    test('renders icon in inline variant', () => {
      render(<CategoryLabel category={mockCategory} variant="inline" showIcon={true} />)
      expect(screen.getByText('🛒')).toBeInTheDocument()
    })
  })

  describe('Input Variant', () => {
    test('renders input variant with color', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="input" showColor={true} />
      )
      const element = container.querySelector('.cursor-pointer')
      expect(element).toBeInTheDocument()
      expect(element).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    test('renders input variant without color', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="input" showColor={false} />
      )
      const element = container.querySelector('.cursor-pointer')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('bg-white', 'dark:bg-gray-700')
    })

    test('renders uncategorized state in input variant', () => {
      const { container } = render(<CategoryLabel category={null} variant="input" />)
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
      const element = container.querySelector('.cursor-pointer')
      expect(element).toBeInTheDocument()
    })

    test('applies hover effect in input variant', () => {
      const { container } = render(
        <CategoryLabel category={mockCategory} variant="input" showColor={false} />
      )
      const element = container.querySelector('.hover\\:bg-gray-50')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Text Truncation', () => {
    test('applies truncate class for long names', () => {
      const longNameCategory = {
        ...mockCategory,
        name: 'Very Long Category Name That Should Be Truncated'
      }
      const { container } = render(<CategoryLabel category={longNameCategory} />)
      const element = container.querySelector('.truncate')
      expect(element).toBeInTheDocument()
    })
  })
})

describe('CategoryTextLabel Component', () => {
  describe('Basic Rendering', () => {
    test('renders text correctly', () => {
      render(<CategoryTextLabel text="All Categories" />)
      expect(screen.getByText('All Categories')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      const { container } = render(
        <CategoryTextLabel text="Test" className="custom-text-class" />
      )
      const element = container.querySelector('.custom-text-class')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Variant Handling', () => {
    test('renders badge variant by default', () => {
      const { container } = render(<CategoryTextLabel text="Test" />)
      const element = container.querySelector('.text-gray-700')
      expect(element).toBeInTheDocument()
    })

    test('renders badge variant explicitly', () => {
      const { container } = render(<CategoryTextLabel text="Test" variant="badge" />)
      const element = container.querySelector('.text-gray-700')
      expect(element).toBeInTheDocument()
    })

    test('renders inline variant', () => {
      const { container } = render(<CategoryTextLabel text="Test" variant="inline" />)
      const element = container.querySelector('.text-gray-700')
      expect(element).toBeInTheDocument()
    })

    test('renders input variant', () => {
      const { container } = render(<CategoryTextLabel text="Test" variant="input" />)
      const element = container.querySelector('.text-gray-500')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('flex', 'items-center')
    })
  })
})