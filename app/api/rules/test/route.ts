import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'
import { z } from 'zod'

const TestRulesSchema = z.object({
  description: z.string(),
  sourceCategory: z.string().optional(),
  sourceId: z.number().int().positive().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = TestRulesSchema.parse(body)

    const result = await rulesModel.applyRulesToTransaction(validatedData)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error testing rules:', error)
    return NextResponse.json(
      { error: 'Failed to test rules' },
      { status: 500 }
    )
  }
}