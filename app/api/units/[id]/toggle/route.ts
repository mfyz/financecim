import { NextRequest, NextResponse } from 'next/server'
import { unitsModel } from '@/db/models/units.model'

// Helper function to parse and validate ID
function parseId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

export async function POST(
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

    // Toggle the unit status
    const updatedUnit = await unitsModel.toggleActive(id)

    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: `Unit ${updatedUnit.active ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('Error toggling unit status:', error)
    
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
        message: 'Failed to toggle unit status'
      },
      { status: 500 }
    )
  }
}