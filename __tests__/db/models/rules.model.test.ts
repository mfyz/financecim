/**
 * @jest-environment node
 */

import { rulesModel } from '@/db/models/rules.model'

describe('rulesModel convenience wrappers', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('applyUnitRules delegates to applyRulesToTransaction and returns unitId', async () => {
    const spy = jest
      .spyOn(rulesModel, 'applyRulesToTransaction')
      .mockResolvedValue({ unitId: 7, categoryId: null })

    const unitId = await rulesModel.applyUnitRules({ description: 'TEST AMAZON', source_id: 1 })

    expect(spy).toHaveBeenCalledWith({ description: 'TEST AMAZON', sourceId: 1 })
    expect(unitId).toBe(7)
  })

  test('applyCategoryRules delegates to applyRulesToTransaction and returns categoryId', async () => {
    const spy = jest
      .spyOn(rulesModel, 'applyRulesToTransaction')
      .mockResolvedValue({ unitId: null, categoryId: 42 })

    const categoryId = await rulesModel.applyCategoryRules({ description: 'GROCERY', source_category: 'Groceries' })

    expect(spy).toHaveBeenCalledWith({ description: 'GROCERY', sourceCategory: 'Groceries' })
    expect(categoryId).toBe(42)
  })
})

