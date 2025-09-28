import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'
import { z } from 'zod'

const UpdateCategoryRuleSchema = z.object({
  ruleType: z.enum(['description', 'source_category']).optional(),
  pattern: z.string().min(1).optional(),
  matchType: z.enum(['contains', 'starts_with', 'exact', 'regex']).optional(),
  categoryId: z.number().int().positive().optional(),
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

    const rule = await rulesModel.getCategoryRuleById(ruleId)

    if (!rule) {
      return NextResponse.json(
        { error: 'Category rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error fetching category rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category rule' },
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
    const validatedData = UpdateCategoryRuleSchema.parse(body)

    const rule = await rulesModel.updateCategoryRule(ruleId, validatedData)

    if (!rule) {
      return NextResponse.json(
        { error: 'Category rule not found' },
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

    console.error('Error updating category rule:', error)
    return NextResponse.json(
      { error: 'Failed to update category rule' },
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

    const deleted = await rulesModel.deleteCategoryRule(ruleId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Category rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Category rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting category rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete category rule' },
      { status: 500 }
    )
  }
}