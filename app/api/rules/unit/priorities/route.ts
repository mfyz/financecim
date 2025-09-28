import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'
import { z } from 'zod'

const PrioritiesSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    priority: z.number().int().min(0)
  })
)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PrioritiesSchema.parse(body)

    const rules = await rulesModel.updateUnitRulePriorities(validatedData)
    return NextResponse.json(rules)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating unit rule priorities:', error)
    return NextResponse.json(
      { error: 'Failed to update unit rule priorities' },
      { status: 500 }
    )
  }
}