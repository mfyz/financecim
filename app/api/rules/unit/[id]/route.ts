import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'
import { z } from 'zod'

const UpdateUnitRuleSchema = z.object({
  ruleType: z.enum(['source', 'description']).optional(),
  pattern: z.string().min(1).optional(),
  matchType: z.enum(['contains', 'starts_with', 'exact', 'regex']).optional(),
  unitId: z.number().int().positive().optional(),
  priority: z.number().int().min(0).optional(),
  active: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ruleId = parseInt(id, 10)

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      )
    }

    const rule = await rulesModel.getUnitRuleById(ruleId)

    if (!rule) {
      return NextResponse.json(
        { error: 'Unit rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error fetching unit rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unit rule' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ruleId = parseInt(id, 10)

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateUnitRuleSchema.parse(body)

    const rule = await rulesModel.updateUnitRule(ruleId, validatedData)

    if (!rule) {
      return NextResponse.json(
        { error: 'Unit rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating unit rule:', error)
    return NextResponse.json(
      { error: 'Failed to update unit rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ruleId = parseInt(id, 10)

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      )
    }

    const deleted = await rulesModel.deleteUnitRule(ruleId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Unit rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Unit rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting unit rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete unit rule' },
      { status: 500 }
    )
  }
}