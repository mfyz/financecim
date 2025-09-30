import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FormField } from '@/components/forms/form-field'

describe('FormField Component', () => {
  it('should render basic input field', () => {
    render(<FormField placeholder="Enter text" />)

    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('block', 'w-full')
  })

  it('should render with label', () => {
    render(<FormField label="Username" placeholder="Enter username" />)

    const label = screen.getByText('Username')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('block', 'text-sm', 'font-medium')
  })

  it('should show required asterisk when required prop is true', () => {
    render(<FormField label="Email" required placeholder="Enter email" />)

    const asterisk = screen.getByText('*')
    expect(asterisk).toBeInTheDocument()
    expect(asterisk).toHaveClass('text-red-500')
  })

  it('should display error message', () => {
    render(<FormField error="This field is required" placeholder="Enter value" />)

    const errorMessage = screen.getByText('This field is required')
    expect(errorMessage).toBeInTheDocument()

    const errorIcon = errorMessage.parentElement?.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Enter value')
    expect(input).toHaveClass('border-red-300')
  })

  it('should display hint text when no error', () => {
    render(<FormField hint="Enter your full name" placeholder="Name" />)

    const hint = screen.getByText('Enter your full name')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveClass('text-sm', 'text-gray-500')
  })

  it('should not display hint when error is present', () => {
    render(
      <FormField
        error="Invalid input"
        hint="This is a hint"
        placeholder="Enter value"
      />
    )

    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid input')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<FormField ref={ref} placeholder="Test input" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.placeholder).toBe('Test input')
  })

  it('should handle user input', async () => {
    const user = userEvent.setup()
    render(<FormField placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement

    await user.type(input, 'Hello World')
    expect(input.value).toBe('Hello World')
  })

  it('should apply custom className', () => {
    render(<FormField className="custom-class" placeholder="Test" />)

    const input = screen.getByPlaceholderText('Test')
    expect(input).toHaveClass('custom-class')
  })

  it('should handle disabled state', () => {
    render(<FormField disabled placeholder="Disabled input" />)

    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed')
  })

  it('should pass through input props', () => {
    render(
      <FormField
        type="email"
        maxLength={50}
        autoComplete="email"
        placeholder="Email"
      />
    )

    const input = screen.getByPlaceholderText('Email') as HTMLInputElement
    expect(input.type).toBe('email')
    expect(input.maxLength).toBe(50)
    expect(input.getAttribute('autocomplete')).toBe('email')
  })

  it('should have proper dark mode classes', () => {
    render(<FormField label="Test" error="Error" placeholder="Test" />)

    const label = screen.getByText('Test')
    expect(label).toHaveClass('dark:text-gray-300')

    const input = screen.getByPlaceholderText('Test')
    expect(input).toHaveClass('dark:bg-gray-700', 'dark:text-white')

    const errorContainer = screen.getByText('Error').parentElement
    expect(errorContainer).toHaveClass('text-red-600', 'dark:text-red-400')
  })
})