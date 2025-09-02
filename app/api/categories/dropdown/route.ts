import { NextRequest, NextResponse } from 'next/server'
import { categoriesModel } from '@/db/models/categories.model'

// GET /api/categories/dropdown - Get categories formatted for dropdown
export async function GET(_request: NextRequest) {
  try {
    const options = await categoriesModel.getForDropdown()
    
    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching category dropdown options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category options' },
      { status: 500 }
    )
  }
}