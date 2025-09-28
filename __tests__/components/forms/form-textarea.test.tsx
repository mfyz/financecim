import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FormTextarea } from '@/components/forms/form-textarea'

describe('FormTextarea Component', () => {
  it('should render basic textarea', () => {
    render(<FormTextarea placeholder="Enter text" />)

    const textarea = screen.getByPlaceholderText('Enter text')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea).toHaveClass('block', 'w-full', 'resize-vertical')
  })

  it('should render with label', () => {
    render(<FormTextarea label="Description" placeholder="Enter description" />)

    const label = screen.getByText('Description')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('block', 'text-sm', 'font-medium')
  })

  it('should show required asterisk when required prop is true', () => {
    render(<FormTextarea label="Comments" required placeholder="Enter comments" />)

    const asterisk = screen.getByText('*')
    expect(asterisk).toBeInTheDocument()
    expect(asterisk).toHaveClass('text-red-500')
  })

  it('should display error message', () => {
    render(<FormTextarea error="This field is required" placeholder="Enter value" />)

    const errorMessage = screen.getByText('This field is required')
    expect(errorMessage).toBeInTheDocument()

    const errorIcon = errorMessage.parentElement?.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText('Enter value')
    expect(textarea).toHaveClass('border-red-300')
  })

  it('should display hint text when no error', () => {
    render(<FormTextarea hint="Maximum 500 characters" placeholder="Notes" />)

    const hint = screen.getByText('Maximum 500 characters')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveClass('text-sm', 'text-gray-500')
  })

  it('should not display hint when error is present', () => {
    render(
      <FormTextarea
        error="Invalid input"
        hint="This is a hint"
        placeholder="Enter value"
      />
    )

    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid input')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<FormTextarea ref={ref} placeholder="Test textarea" />)

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    expect(ref.current?.placeholder).toBe('Test textarea')
  })

  it('should handle user input', async () => {
    const user = userEvent.setup()
    render(<FormTextarea placeholder="Type here" />)

    const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement

    await user.type(textarea, 'This is a long text with multiple lines')
    expect(textarea.value).toBe('This is a long text with multiple lines')
  })

  it('should apply custom className', () => {
    render(<FormTextarea className="custom-class" placeholder="Test" />)

    const textarea = screen.getByPlaceholderText('Test')
    expect(textarea).toHaveClass('custom-class')
  })

  it('should handle disabled state', () => {
    render(<FormTextarea disabled placeholder="Disabled textarea" />)

    const textarea = screen.getByPlaceholderText('Disabled textarea')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed')
  })

  it('should pass through textarea props', () => {
    render(
      <FormTextarea
        rows={10}
        cols={50}
        maxLength={500}
        placeholder="Description"
      />
    )

    const textarea = screen.getByPlaceholderText('Description') as HTMLTextAreaElement
    expect(textarea.rows).toBe(10)
    expect(textarea.cols).toBe(50)
    expect(textarea.maxLength).toBe(500)
  })

  it('should have proper dark mode classes', () => {
    render(<FormTextarea label="Test" error="Error" placeholder="Test" />)

    const label = screen.getByText('Test')
    expect(label).toHaveClass('dark:text-gray-300')

    const textarea = screen.getByPlaceholderText('Test')
    expect(textarea).toHaveClass('dark:bg-gray-700', 'dark:text-white')

    const errorContainer = screen.getByText('Error').parentElement
    expect(errorContainer).toHaveClass('text-red-600', 'dark:text-red-400')
  })

  it('should be resizable vertically only', () => {
    render(<FormTextarea placeholder="Resizable" />)

    const textarea = screen.getByPlaceholderText('Resizable')
    expect(textarea).toHaveClass('resize-vertical')
  })
})