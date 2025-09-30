import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { FormCheckbox } from '@/components/forms/form-checkbox'

describe('FormCheckbox Component', () => {
  it('should render basic checkbox', () => {
    render(<FormCheckbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveAttribute('type', 'checkbox')
    expect(checkbox).toHaveClass('h-4', 'w-4')
  })

  it('should render with label', () => {
    render(<FormCheckbox label="Accept terms and conditions" />)

    const label = screen.getByText('Accept terms and conditions')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('font-medium', 'text-gray-700')
  })

  it('should display error message', () => {
    render(<FormCheckbox error="You must accept the terms" />)

    const errorMessage = screen.getByText('You must accept the terms')
    expect(errorMessage).toBeInTheDocument()

    const errorIcon = errorMessage.parentElement?.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('border-red-300')
  })

  it('should display hint text when no error', () => {
    render(<FormCheckbox hint="This is optional" />)

    const hint = screen.getByText('This is optional')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveClass('text-sm', 'text-gray-500')
  })

  it('should not display hint when error is present', () => {
    render(
      <FormCheckbox
        error="Required field"
        hint="This is a hint"
      />
    )

    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument()
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<FormCheckbox ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.type).toBe('checkbox')
  })

  it('should handle user clicks', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(<FormCheckbox onChange={onChange} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement

    expect(checkbox.checked).toBe(false)

    await user.click(checkbox)

    expect(onChange).toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(<FormCheckbox className="custom-class" />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('custom-class')
  })

  it('should handle disabled state', () => {
    render(<FormCheckbox disabled label="Disabled option" />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('should handle checked state', () => {
    render(<FormCheckbox checked readOnly />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('should pass through input props', () => {
    render(
      <FormCheckbox
        name="agreement"
        id="terms-checkbox"
        value="accepted"
      />
    )

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.name).toBe('agreement')
    expect(checkbox.id).toBe('terms-checkbox')
    expect(checkbox.value).toBe('accepted')
  })

  it('should have proper dark mode classes', () => {
    render(<FormCheckbox label="Test" error="Error" />)

    const label = screen.getByText('Test')
    expect(label).toHaveClass('dark:text-gray-300')

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('dark:bg-gray-700', 'dark:border-gray-600')

    const errorContainer = screen.getByText('Error').parentElement
    expect(errorContainer).toHaveClass('text-red-600', 'dark:text-red-400')
  })

  it('should have proper layout structure', () => {
    render(<FormCheckbox label="Remember me" />)

    const container = screen.getByRole('checkbox').parentElement
    expect(container).toHaveClass('flex', 'items-center', 'h-5')

    const labelContainer = screen.getByText('Remember me').parentElement
    expect(labelContainer).toHaveClass('ml-3', 'text-sm')
  })

  it('should handle controlled checkbox', async () => {
    const user = userEvent.setup()
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false)
      return (
        <FormCheckbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          label="Controlled checkbox"
        />
      )
    }

    render(<TestComponent />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    await user.click(checkbox)
    expect(checkbox.checked).toBe(true)

    await user.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  it('should have focus ring styles', () => {
    render(<FormCheckbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('focus:ring-blue-500')
  })
})