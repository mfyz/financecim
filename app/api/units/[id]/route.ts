import { NextRequest, NextResponse } from 'next/server'
import { unitsModel } from '@/db/models/units.model'
import { z } from 'zod'

// Validation schemas
const UpdateUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().optional(),
  active: z.boolean().optional()
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
          message: 'Unit ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    const unit = await unitsModel.getById(id)
    
    if (!unit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unit not found',
          message: `Unit with ID ${idParam} does not exist`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: unit
    })

  } catch (error) {
    console.error('Error fetching unit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch unit'
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
          message: 'Unit ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = UpdateUnitSchema.safeParse(body)
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

    // If updating name, check if it already exists (excluding current unit)
    if (updateData.name) {
      const nameExists = await unitsModel.existsByName(updateData.name, id)
      if (nameExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unit name already exists',
            message: `A unit with the name "${updateData.name}" already exists`
          },
          { status: 409 }
        )
      }
    }

    // Update the unit
    const updatedUnit = await unitsModel.update(id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: 'Unit updated successfully'
    })

  } catch (error) {
    console.error('Error updating unit:', error)
    
    if (error instanceof Error && error.message === 'Unit not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unit not found',
          message: `Unit with ID ${idParam} does not exist`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to update unit'
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
          message: 'Unit ID must be a positive integer'
        },
        { status: 400 }
      )
    }

    // Delete the unit
    await unitsModel.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Unit deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting unit:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unit not found') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unit not found',
            message: `Unit with ID ${idParam} does not exist`
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Cannot delete unit: it is referenced by existing transactions')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete unit',
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
        message: 'Failed to delete unit'
      },
      { status: 500 }
    )
  }
}