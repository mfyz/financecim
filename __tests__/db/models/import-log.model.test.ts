/**
 * @jest-environment node
 */

import { importLogModel } from '@/db/models/import-log.model'

describe('importLogModel.logImport mapping', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('maps snake_case to camelCase and calls create()', async () => {
    const createSpy = jest
      .spyOn(importLogModel, 'create')
      // @ts-expect-error allow partial mock return
      .mockResolvedValue({ id: 123 })

    const payload = {
      source_id: 5,
      file_name: 'file.csv',
      transactions_added: 10,
      transactions_skipped: 2,
      transactions_updated: 1,
      status: 'success' as const,
      error_message: undefined,
      metadata: { sample: true },
    }

    const result = await importLogModel.logImport(payload)

    expect(createSpy).toHaveBeenCalledWith({
      sourceId: 5,
      fileName: 'file.csv',
      transactionsAdded: 10,
      transactionsSkipped: 2,
      transactionsUpdated: 1,
      status: 'success',
      errorMessage: undefined,
      metadata: { sample: true },
    })
    expect(result).toEqual({ id: 123 })
  })
})

