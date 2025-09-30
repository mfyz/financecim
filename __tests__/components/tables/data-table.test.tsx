import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { DataTable, Column } from '@/components/tables/data-table'

interface TestData {
  id: number
  name: string
  age: number
  email: string
}

describe('DataTable Component', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' }
  ]

  const mockColumns: Column<TestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', sortable: true, filterable: true },
    { key: 'email', header: 'Email', filterable: true }
  ]

  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)

    // Check headers
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()

    // Check data
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('should render search input when searchable is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />)

    const searchInput = screen.getByPlaceholderText('Search...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should filter data based on search term', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'Jane')

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('should render column filters when filterable is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} filterable={true} />)

    const ageFilter = screen.getByPlaceholderText('Filter Age')
    const emailFilter = screen.getByPlaceholderText('Filter Email')

    expect(ageFilter).toBeInTheDocument()
    expect(emailFilter).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Filter Name')).not.toBeInTheDocument() // Name is not filterable
  })

  it('should filter data based on column filters', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} filterable={true} />)

    const ageFilter = screen.getByPlaceholderText('Filter Age')
    await user.type(ageFilter, '30')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('should sort data when clicking sortable column headers', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} />)

    const nameHeader = screen.getByText('Name').parentElement?.parentElement

    // Get all rows before sorting
    let rows = screen.getAllByRole('row').slice(1) // Skip header row
    expect(rows[0]).toHaveTextContent('John Doe')
    expect(rows[1]).toHaveTextContent('Jane Smith')
    expect(rows[2]).toHaveTextContent('Bob Johnson')

    // Click to sort ascending
    await user.click(nameHeader!)

    rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Bob Johnson')
    expect(rows[1]).toHaveTextContent('Jane Smith')
    expect(rows[2]).toHaveTextContent('John Doe')

    // Click again to sort descending
    await user.click(nameHeader!)

    rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('John Doe')
    expect(rows[1]).toHaveTextContent('Jane Smith')
    expect(rows[2]).toHaveTextContent('Bob Johnson')
  })

  it('should show sort indicators on sortable columns', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)

    const nameHeader = screen.getByText('Name').parentElement
    const chevronUp = nameHeader?.querySelector('.w-3.h-3')
    const chevronDown = nameHeader?.querySelectorAll('.w-3.h-3')[1]

    expect(chevronUp).toBeInTheDocument()
    expect(chevronDown).toBeInTheDocument()
  })

  it('should handle row click events', async () => {
    const user = userEvent.setup()
    const handleRowClick = jest.fn()

    render(<DataTable data={mockData} columns={mockColumns} onRowClick={handleRowClick} />)

    const firstRow = screen.getByText('John Doe').closest('tr')
    await user.click(firstRow!)

    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('should render custom column content with render function', () => {
    const columnsWithRender: Column<TestData>[] = [
      ...mockColumns.slice(0, 1),
      {
        key: 'name',
        header: 'Name',
        render: (item) => <span className="custom-name">Mr. {item.name}</span>
      }
    ]

    render(<DataTable data={mockData} columns={columnsWithRender} />)

    expect(screen.getByText('Mr. John Doe')).toBeInTheDocument()
    expect(screen.getByText('Mr. Jane Smith')).toBeInTheDocument()
  })

  it('should display pagination when enabled', () => {
    render(<DataTable data={mockData} columns={mockColumns} pagination={true} pageSize={2} />)

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText(/Showing 1 to 2 of 3 results/)).toBeInTheDocument()
  })

  it('should paginate data correctly', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} pagination={true} pageSize={2} />)

    // First page should show 2 items
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()

    // Navigate to next page
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    // Second page should show remaining item
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('should disable pagination buttons appropriately', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} pagination={true} pageSize={2} />)

    const prevButton = screen.getByText('Previous')
    const nextButton = screen.getByText('Next')

    // Previous should be disabled on first page
    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    // Navigate to last page
    await user.click(nextButton)

    // Next should be disabled on last page
    expect(prevButton).not.toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('should show empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />)

    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<DataTable data={mockData} columns={mockColumns} className="custom-table" />)

    const tableContainer = screen.getByText('ID').closest('.custom-table')
    expect(tableContainer).toBeInTheDocument()
  })

  it('should apply column className', () => {
    const columnsWithClass: Column<TestData>[] = [
      { key: 'id', header: 'ID', className: 'text-center' },
      ...mockColumns.slice(1)
    ]

    render(<DataTable data={mockData} columns={columnsWithClass} />)

    const idCells = screen.getAllByRole('cell').filter(cell =>
      ['1', '2', '3'].includes(cell.textContent || '')
    )

    idCells.forEach(cell => {
      expect(cell).toHaveClass('text-center')
    })
  })

  it('should combine search and sort functionality', async () => {
    const user = userEvent.setup()
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />)

    // Search for names containing only 'Jane'
    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'Jane')

    // Should only show Jane
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()

    // Clear search and search for 'Jo'
    await user.clear(searchInput)
    await user.type(searchInput, 'Jo')

    // Should show John and Bob Johnson (both contain 'Jo')
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()

    // Sort by name
    const nameHeader = screen.getByText('Name').parentElement?.parentElement
    await user.click(nameHeader!)

    // Check order after sorting
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Bob Johnson')
    expect(rows[1]).toHaveTextContent('John Doe')
  })

  it('should have proper dark mode classes', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)

    const table = screen.getByRole('table')
    const container = table.closest('.bg-white')

    expect(container).toHaveClass('dark:bg-gray-800')

    const thead = table.querySelector('thead')
    expect(thead).toHaveClass('dark:bg-gray-700')
  })

  it('should not render search or filters when disabled', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        searchable={false}
        filterable={false}
      />
    )

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Filter Age')).not.toBeInTheDocument()
  })
})