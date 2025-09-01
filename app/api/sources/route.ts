import { NextRequest, NextResponse } from 'next/server'
import { sourcesModel } from '@/db/models/sources.model'
import { z } from 'zod'

// Validation schemas
const CreateSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  type: z.enum(['bank', 'credit_card', 'manual'], { 
    errorMap: () => ({ message: 'Type must be bank, credit_card, or manual' }) 
  })
})

const UpdateSourceSchema = CreateSourceSchema.partial()

export async function GET() {
  try {
    const sources = await sourcesModel.getAll()
    
    return NextResponse.json({
      success: true,
      data: sources
    })
  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch sources'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = CreateSourceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, type } = validationResult.data

    // Check if source name already exists
    const nameExists = await sourcesModel.existsByName(name)
    if (nameExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Source name already exists',
          message: `A source with the name "${name}" already exists`
        },
        { status: 409 }
      )
    }

    // Create the source
    const newSource = await sourcesModel.create({ name, type })

    return NextResponse.json({
      success: true,
      data: newSource,
      message: 'Source created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating source:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to create source'
      },
      { status: 500 }
    )
  }
}