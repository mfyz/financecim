import { NextRequest, NextResponse } from 'next/server'
import { sourcesModel } from '@/db/models/sources.model'
import { z } from 'zod'

// Validation schemas
const UpdateSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  type: z.enum(['bank', 'credit_card', 'manual'], { 
    errorMap: () => ({ message: 'Type must be bank, credit_card, or manual' }) 
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

// Helper function to parse and validate ID
function parseId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseId(idParam)
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid ID',
          message: 'Source ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    const source = await sourcesModel.getById(id)
    
    if (!source) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Source not found',
          message: `Source with ID ${idParam} does not exist`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: source
    })

  } catch (error) {
    console.error('Error fetching source:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch source'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params
  try {
    const id = parseId(idParam)
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid ID',
          message: 'Source ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = UpdateSourceSchema.safeParse(body)
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

    const updateData = validationResult.data

    // If updating name, check if it already exists (excluding current source)
    if (updateData.name) {
      const nameExists = await sourcesModel.existsByName(updateData.name, id)
      if (nameExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Source name already exists',
            message: `A source with the name "${updateData.name}" already exists`
          },
          { status: 409 }
        )
      }
    }

    // Update the source
    const updatedSource = await sourcesModel.update(id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedSource,
      message: 'Source updated successfully'
    })

  } catch (error) {
    console.error('Error updating source:', error)
    
    if (error instanceof Error && error.message === 'Source not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Source not found',
          message: `Source with ID ${idParam} does not exist`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to update source'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params
  try {
    const id = parseId(idParam)
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid ID',
          message: 'Source ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    // Delete the source
    await sourcesModel.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting source:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Source not found') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Source not found',
            message: `Source with ID ${idParam} does not exist`
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Cannot delete source: it is referenced by existing transactions')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete source',
            message: error.message
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to delete source'
      },
      { status: 500 }
    )
  }
}