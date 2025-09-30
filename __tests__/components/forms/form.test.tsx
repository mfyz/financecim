import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form, FormSection, FormActions } from '@/components/forms/form'

describe('Form Components', () => {
  describe('Form', () => {
    it('should render children correctly', () => {
      render(
        <Form>
          <div data-testid="form-child">Test Content</div>
        </Form>
      )

      const child = screen.getByTestId('form-child')
      expect(child).toBeInTheDocument()
      expect(child).toHaveTextContent('Test Content')
    })

    it('should apply default spacing classes', () => {
      const { container } = render(
        <Form>
          <div>Content</div>
        </Form>
      )

      const form = container.querySelector('form')
      expect(form).toHaveClass('space-y-6')
    })

    it('should merge custom className with default classes', () => {
      const { container } = render(
        <Form className="custom-class">
          <div>Content</div>
        </Form>
      )

      const form = container.querySelector('form')
      expect(form).toHaveClass('space-y-6', 'custom-class')
    })

    it('should pass through form attributes', () => {
      const handleSubmit = jest.fn()
      const { container } = render(
        <Form onSubmit={handleSubmit} id="test-form" data-testid="form-element">
          <div>Content</div>
        </Form>
      )

      const form = screen.getByTestId('form-element')
      expect(form).toHaveAttribute('id', 'test-form')
    })
  })

  describe('FormSection', () => {
    it('should render children without title or description', () => {
      render(
        <FormSection>
          <div data-testid="section-child">Section Content</div>
        </FormSection>
      )

      const child = screen.getByTestId('section-child')
      expect(child).toBeInTheDocument()
      expect(child).toHaveTextContent('Section Content')
    })

    it('should render title when provided', () => {
      render(
        <FormSection title="Test Title">
          <div>Content</div>
        </FormSection>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Title').tagName).toBe('H3')
    })

    it('should render description when provided', () => {
      render(
        <FormSection description="Test description text">
          <div>Content</div>
        </FormSection>
      )

      expect(screen.getByText('Test description text')).toBeInTheDocument()
    })

    it('should render both title and description', () => {
      render(
        <FormSection title="Section Title" description="Section description">
          <div>Content</div>
        </FormSection>
      )

      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Section description')).toBeInTheDocument()
    })

    it('should apply correct styling classes', () => {
      const { container } = render(
        <FormSection title="Title">
          <div>Content</div>
        </FormSection>
      )

      const titleElement = screen.getByText('Title')
      expect(titleElement).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white')
    })

    it('should apply custom className', () => {
      const { container } = render(
        <FormSection className="custom-section-class">
          <div>Content</div>
        </FormSection>
      )

      const section = container.firstChild
      expect(section).toHaveClass('space-y-4', 'custom-section-class')
    })

    it('should not render header div when no title or description', () => {
      const { container } = render(
        <FormSection>
          <div data-testid="child">Content</div>
        </FormSection>
      )

      // Should only have the wrapper and children container
      const section = container.firstChild as HTMLElement
      expect(section.children.length).toBe(1) // Only the children container
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('FormActions', () => {
    it('should render children correctly', () => {
      render(
        <FormActions>
          <button type="button">Cancel</button>
          <button type="submit">Submit</button>
        </FormActions>
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })

    it('should apply default styling classes', () => {
      const { container } = render(
        <FormActions>
          <button>Action</button>
        </FormActions>
      )

      const actions = container.firstChild
      expect(actions).toHaveClass('flex', 'justify-end', 'space-x-3', 'pt-6', 'border-t', 'border-gray-200', 'dark:border-gray-700')
    })

    it('should merge custom className with defaults', () => {
      const { container } = render(
        <FormActions className="custom-actions">
          <button>Action</button>
        </FormActions>
      )

      const actions = container.firstChild
      expect(actions).toHaveClass('flex', 'justify-end', 'custom-actions')
    })

    it('should render multiple action buttons with proper spacing', () => {
      render(
        <FormActions>
          <button data-testid="btn-1">Button 1</button>
          <button data-testid="btn-2">Button 2</button>
          <button data-testid="btn-3">Button 3</button>
        </FormActions>
      )

      expect(screen.getByTestId('btn-1')).toBeInTheDocument()
      expect(screen.getByTestId('btn-2')).toBeInTheDocument()
      expect(screen.getByTestId('btn-3')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work together as a complete form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())

      render(
        <Form onSubmit={handleSubmit}>
          <FormSection title="User Information" description="Please fill in your details">
            <input type="text" placeholder="Name" data-testid="name-input" />
            <input type="email" placeholder="Email" data-testid="email-input" />
          </FormSection>
          <FormSection title="Preferences">
            <input type="checkbox" data-testid="newsletter-checkbox" />
          </FormSection>
          <FormActions>
            <button type="button" data-testid="cancel-btn">Cancel</button>
            <button type="submit" data-testid="submit-btn">Submit</button>
          </FormActions>
        </Form>
      )

      // Check all sections are rendered
      expect(screen.getByText('User Information')).toBeInTheDocument()
      expect(screen.getByText('Please fill in your details')).toBeInTheDocument()
      expect(screen.getByText('Preferences')).toBeInTheDocument()

      // Check form fields
      expect(screen.getByTestId('name-input')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('newsletter-checkbox')).toBeInTheDocument()

      // Check actions
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument()
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument()

      // Submit form
      const form = screen.getByTestId('submit-btn').closest('form')
      expect(form).not.toBeNull()
    })
  })
})