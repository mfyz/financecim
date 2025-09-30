import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MainNav } from '@/components/main-nav'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, className, onClick }: any) => {
      return (
        <a href={href} className={className} onClick={onClick}>
          {children}
        </a>
      )
    }
  }
})

// Mock theme provider
jest.mock('@/components/theme-provider', () => ({
  useTheme: jest.fn()
}))

describe('MainNav Component', () => {
  const mockToggleTheme = jest.fn()
  const mockUsePathname = usePathname as jest.Mock
  const mockUseTheme = useTheme as jest.Mock

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    })
    mockToggleTheme.mockClear()
  })

  it('should render the navigation with app title', () => {
    render(<MainNav />)

    const title = screen.getByText('Financecim')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-xl', 'font-bold')
  })

  it('should render all navigation items on desktop', () => {
    render(<MainNav />)

    const navItems = [
      'Dashboard',
      'Sources',
      'Units',
      'Categories',
      'Rules',
      'Transactions',
      'Import'
    ]

    navItems.forEach(item => {
      const link = screen.getByRole('link', { name: new RegExp(item) })
      expect(link).toBeInTheDocument()
    })
  })

  it('should highlight active navigation item', () => {
    mockUsePathname.mockReturnValue('/categories')
    render(<MainNav />)

    const categoriesLink = screen.getByRole('link', { name: /Categories/ })
    expect(categoriesLink).toHaveClass('bg-blue-100', 'text-blue-700')

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/ })
    expect(dashboardLink).not.toHaveClass('bg-blue-100')
    expect(dashboardLink).toHaveClass('text-gray-700')
  })

  it('should render theme toggle button', () => {
    render(<MainNav />)

    const themeButton = screen.getByLabelText('Toggle theme')
    expect(themeButton).toBeInTheDocument()
  })

  it('should show moon icon in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    })
    render(<MainNav />)

    const themeButton = screen.getByLabelText('Toggle theme')
    const moonIcon = themeButton.querySelector('svg')
    expect(moonIcon).toBeInTheDocument()
    expect(moonIcon).toHaveClass('w-5', 'h-5')
  })

  it('should show sun icon in dark mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme
    })
    render(<MainNav />)

    const themeButton = screen.getByLabelText('Toggle theme')
    const sunIcon = themeButton.querySelector('svg')
    expect(sunIcon).toBeInTheDocument()
    expect(sunIcon).toHaveClass('w-5', 'h-5')
  })

  it('should call toggleTheme when theme button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainNav />)

    const themeButton = screen.getByLabelText('Toggle theme')
    await user.click(themeButton)

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('should render mobile menu button on mobile', () => {
    render(<MainNav />)

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    expect(mobileMenuButton).toBeInTheDocument()
    expect(mobileMenuButton.parentElement).toHaveClass('md:hidden')
  })

  it('should toggle mobile menu when button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainNav />)

    // Mobile menu should not be visible initially
    const mobileMenuItems = screen.queryAllByRole('link').filter(link =>
      link.className.includes('text-base')
    )
    expect(mobileMenuItems).toHaveLength(0)

    // Click mobile menu button
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    await user.click(mobileMenuButton)

    // Mobile menu should be visible
    const visibleMobileItems = screen.getAllByRole('link').filter(link =>
      link.className.includes('text-base')
    )
    expect(visibleMobileItems).toHaveLength(7) // All navigation items
  })

  it('should close mobile menu when a link is clicked', async () => {
    const user = userEvent.setup()
    render(<MainNav />)

    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    await user.click(mobileMenuButton)

    // Get mobile menu links (they have text-base class)
    const mobileLinks = screen.getAllByRole('link').filter(link =>
      link.className.includes('text-base')
    )

    // Click on a mobile link
    await user.click(mobileLinks[0])

    // Mobile menu should be closed
    const remainingMobileLinks = screen.queryAllByRole('link').filter(link =>
      link.className.includes('text-base')
    )
    expect(remainingMobileLinks).toHaveLength(0)
  })

  it('should have proper navigation links', () => {
    render(<MainNav />)

    const expectedLinks = [
      { name: 'Dashboard', href: '/' },
      { name: 'Sources', href: '/sources' },
      { name: 'Units', href: '/units' },
      { name: 'Categories', href: '/categories' },
      { name: 'Rules', href: '/rules' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'Import', href: '/import' }
    ]

    expectedLinks.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(name) })
      expect(link).toHaveAttribute('href', href)
    })
  })

  it('should have proper dark mode classes', () => {
    render(<MainNav />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700')

    const title = screen.getByText('Financecim')
    expect(title).toHaveClass('dark:text-white')
  })

  it('should have sticky positioning', () => {
    render(<MainNav />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('sticky', 'top-0', 'z-50')
  })

  it('should render navigation icons', () => {
    render(<MainNav />)

    // Each navigation item should have an icon
    const links = screen.getAllByRole('link').filter(link =>
      !link.className.includes('text-base') // Exclude mobile links
    )

    links.forEach(link => {
      if (link.textContent !== 'Financecim') { // Skip the title link if it exists
        const icon = link.querySelector('svg')
        if (link.textContent?.includes('Dashboard') ||
            link.textContent?.includes('Sources') ||
            link.textContent?.includes('Units') ||
            link.textContent?.includes('Categories') ||
            link.textContent?.includes('Rules') ||
            link.textContent?.includes('Transactions') ||
            link.textContent?.includes('Import')) {
          expect(icon).toBeInTheDocument()
          expect(icon).toHaveClass('w-3.5', 'h-3.5')
        }
      }
    })
  })

  it('should have proper mobile menu styling', async () => {
    const user = userEvent.setup()
    render(<MainNav />)

    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    await user.click(mobileMenuButton)

    // Check mobile menu container classes - look for the mobile menu div with md:hidden
    const mobileLinks = screen.getAllByRole('link').filter(link =>
      link.className.includes('text-base')
    )

    // The mobile menu container is the parent div of mobile links
    if (mobileLinks.length > 0) {
      const mobileMenuContainer = mobileLinks[0].parentElement?.parentElement
      expect(mobileMenuContainer).toHaveClass('md:hidden')
      expect(mobileMenuContainer).toHaveClass('bg-white', 'dark:bg-gray-800')
    }
  })
})