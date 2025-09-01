import { NextRequest, NextResponse } from 'next/server'
import { categoriesModel } from '@/db/models/categories.model'
import { z } from 'zod'

// Validation schema for creating/updating categories
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  parentCategoryId: z.number().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(10).nullable().optional(),
  monthlyBudget: z.number().positive().nullable().optional(),
})

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flat = searchParams.get('flat') === 'true'
    
    const categories = flat 
      ? await categoriesModel.getAllFlat()
      : await categoriesModel.getAll()
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = categorySchema.parse(body)
    
    // Create category
    const newCategory = await categoriesModel.create({
      name: validatedData.name,
      parentCategoryId: validatedData.parentCategoryId ?? null,
      color: validatedData.color,
      icon: validatedData.icon ?? null,
      monthlyBudget: validatedData.monthlyBudget ?? null,
    })
    
    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}