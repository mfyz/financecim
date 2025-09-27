import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'
import { z } from 'zod'

const UnitRuleSchema = z.object({
  ruleType: z.enum(['source', 'description']),
  pattern: z.string().min(1),
  matchType: z.enum(['contains', 'starts_with', 'exact', 'regex']),
  unitId: z.number().int().positive(),
  priority: z.number().int().min(0),
  active: z.boolean().optional()
})

export async function GET() {
  try {
    const rules = await rulesModel.getAllUnitRules()
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching unit rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unit rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = UnitRuleSchema.parse(body)

    const rule = await rulesModel.createUnitRule(validatedData)
    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating unit rule:', error)
    return NextResponse.json(
      { error: 'Failed to create unit rule' },
      { status: 500 }
    )
  }
}