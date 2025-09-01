import { NextRequest, NextResponse } from 'next/server'
import { categoriesModel } from '@/db/models/categories.model'
import { z } from 'zod'

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentCategoryId: z.number().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).nullable().optional(),
  monthlyBudget: z.number().positive().nullable().optional(),
})

// GET /api/categories/[id] - Get single category
export async function GET(
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
    
    const category = await categoriesModel.getById(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
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
    const validatedData = updateCategorySchema.parse(body)
    
    // Update category
    const updatedCategory = await categoriesModel.update(id, validatedData)
    
    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message === 'A category cannot be its own parent' || 
          error.message === 'This change would create a circular dependency') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
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
    
    await categoriesModel.delete(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Cannot delete category with subcategories') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}