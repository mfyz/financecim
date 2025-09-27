import { NextRequest, NextResponse } from 'next/server'
import { rulesModel } from '@/db/models/rules.model'

export async function POST(
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

    const rule = await rulesModel.toggleCategoryRuleStatus(ruleId)

    if (!rule) {
      return NextResponse.json(
        { error: 'Category rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error toggling category rule status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle category rule status' },
      { status: 500 }
    )
  }
}