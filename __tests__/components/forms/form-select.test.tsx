import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FormSelect } from '@/components/forms/form-select'

describe('FormSelect Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true }
  ]

  it('should render select with options', () => {
    render(<FormSelect options={mockOptions} />)

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('should render with label', () => {
    render(<FormSelect label="Choose Option" options={mockOptions} />)

    const label = screen.getByText('Choose Option')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('block', 'text-sm', 'font-medium')
  })

  it('should show required asterisk when required prop is true', () => {
    render(<FormSelect label="Category" required options={mockOptions} />)

    const asterisk = screen.getByText('*')
    expect(asterisk).toBeInTheDocument()
    expect(asterisk).toHaveClass('text-red-500')
  })

  it('should display placeholder option', () => {
    render(<FormSelect placeholder="Select an option" options={mockOptions} />)

    const placeholder = screen.getByText('Select an option')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder.closest('option')).toBeDisabled()
  })

  it('should display error message', () => {
    render(<FormSelect error="Please select an option" options={mockOptions} />)

    const errorMessage = screen.getByText('Please select an option')
    expect(errorMessage).toBeInTheDocument()

    const errorIcon = errorMessage.parentElement?.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('border-red-300')
  })

  it('should display hint text when no error', () => {
    render(<FormSelect hint="Choose carefully" options={mockOptions} />)

    const hint = screen.getByText('Choose carefully')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveClass('text-sm', 'text-gray-500')
  })

  it('should not display hint when error is present', () => {
    render(
      <FormSelect
        error="Invalid selection"
        hint="This is a hint"
        options={mockOptions}
      />
    )

    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid selection')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>()
    render(<FormSelect ref={ref} options={mockOptions} />)

    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
    expect(ref.current?.tagName).toBe('SELECT')
  })

  it('should handle user selection', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(<FormSelect options={mockOptions} onChange={onChange} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement

    await user.selectOptions(select, 'option2')

    expect(select.value).toBe('option2')
    expect(onChange).toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(<FormSelect className="custom-class" options={mockOptions} />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })

  it('should handle disabled state', () => {
    render(<FormSelect disabled options={mockOptions} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
    expect(select).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed')
  })

  it('should disable specific options', () => {
    render(<FormSelect options={mockOptions} />)

    const option3 = screen.getByText('Option 3').closest('option')
    expect(option3).toBeDisabled()

    const option1 = screen.getByText('Option 1').closest('option')
    expect(option1).not.toBeDisabled()
  })

  it('should pass through select props', () => {
    render(
      <FormSelect
        name="category"
        id="category-select"
        options={mockOptions}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.name).toBe('category')
    expect(select.id).toBe('category-select')
  })

  it('should have proper dark mode classes', () => {
    render(<FormSelect label="Test" error="Error" options={mockOptions} />)

    const label = screen.getByText('Test')
    expect(label).toHaveClass('dark:text-gray-300')

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('dark:bg-gray-700', 'dark:text-white')

    const errorContainer = screen.getByText('Error').parentElement
    expect(errorContainer).toHaveClass('text-red-600', 'dark:text-red-400')
  })

  it('should render chevron down icon', () => {
    render(<FormSelect options={mockOptions} />)

    const chevronContainer = document.querySelector('.pointer-events-none')
    expect(chevronContainer).toBeInTheDocument()

    const chevronIcon = chevronContainer?.querySelector('svg')
    expect(chevronIcon).toBeInTheDocument()
    expect(chevronIcon).toHaveClass('h-4', 'w-4')
  })

  it('should have appearance-none class for custom styling', () => {
    render(<FormSelect options={mockOptions} />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('appearance-none')
  })
})