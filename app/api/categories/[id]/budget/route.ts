import { NextRequest, NextResponse } from 'next/server'
import { categoriesModel } from '@/db/models/categories.model'
import { z } from 'zod'

// Validation schema for budget update
const budgetSchema = z.object({
  monthlyBudget: z.number().positive().nullable(),
})

// PATCH /api/categories/[id]/budget - Update category budget
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const validatedData = budgetSchema.parse(body)
    
    // Update budget
    const updatedCategory = await categoriesModel.updateBudget(
      id, 
      validatedData.monthlyBudget
    )
    
    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Category not found') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    console.error('Error updating category budget:', error)
    return NextResponse.json(
      { error: 'Failed to update category budget' },
      { status: 500 }
    )
  }
}