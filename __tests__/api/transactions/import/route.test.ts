/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/transactions/import/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getByHash: jest.fn(),
    create: jest.fn(),
  },
}))

const mockModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('POST /api/transactions/import', () => {
  let consoleSpy: jest.SpyInstance
  let consoleErrSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrSpy.mockRestore()
  })

  it('imports new transactions via model and skips none', async () => {
    mockModel.getByHash.mockResolvedValue(null)
    mockModel.create.mockResolvedValue({ id: 1 } as any)

    const items = [
      { date: '2024-01-15', description: 'T1', amount: -50, source_id: 1, hash: 'h1' },
      { date: '2024-01-16', description: 'T2', amount: 100, source_id: 1, hash: 'h2' },
    ]

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: items }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({ success: true, imported: 2, skipped: 0, total: 2 })
    expect(mockModel.getByHash).toHaveBeenCalledTimes(2)
    expect(mockModel.create).toHaveBeenCalledTimes(2)
    expect(mockModel.create).toHaveBeenNthCalledWith(1, items[0])
  })

  it('skips duplicates when hash already exists', async () => {
    mockModel.getByHash.mockResolvedValueOnce({ id: 10 } as any).mockResolvedValueOnce(null)
    mockModel.create.mockResolvedValue({ id: 2 } as any)

    const items = [
      { date: '2024-01-15', description: 'Dup', amount: -10, source_id: 1, hash: 'dup' },
      { date: '2024-01-16', description: 'New', amount: 5, source_id: 1, hash: 'new' },
    ]

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: items }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({ success: true, imported: 1, skipped: 1, total: 2 })
    expect(mockModel.create).toHaveBeenCalledTimes(1)
    expect(mockModel.create).toHaveBeenCalledWith(items[1])
  })

  it('returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: 'nope' }),
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body).toEqual({ success: false, error: 'Invalid transaction data' })
  })

  it('continues after per-item errors', async () => {
    mockModel.getByHash.mockResolvedValue(null)
    mockModel.create
      .mockRejectedValueOnce(new Error('create failed'))
      .mockResolvedValueOnce({ id: 2 } as any)

    const items = [
      { date: '2024-01-15', description: 'Bad', amount: -10, source_id: 1, hash: 'a' },
      { date: '2024-01-16', description: 'Good', amount: 10, source_id: 1, hash: 'b' },
    ]

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: items }),
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.imported).toBe(1)
    expect(body.errors.length).toBe(1)
  })
})
