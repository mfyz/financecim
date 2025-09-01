import { NextRequest, NextResponse } from 'next/server'
import { unitsModel } from '@/db/models/units.model'
import { z } from 'zod'

// Validation schemas
const CreateUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required').regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
  icon: z.string().optional(),
  active: z.boolean().optional().default(true)
})

const UpdateUnitSchema = CreateUnitSchema.partial()

export async function GET() {
  try {
    const units = await unitsModel.getAll()
    
    return NextResponse.json({
      success: true,
      data: units
    })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch units'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = CreateUnitSchema.safeParse(body)
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

    const { name, description, color, icon, active } = validationResult.data

    // Check if unit name already exists
    const nameExists = await unitsModel.existsByName(name)
    if (nameExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unit name already exists',
          message: `A unit with the name "${name}" already exists`
        },
        { status: 409 }
      )
    }

    // Create the unit
    const newUnit = await unitsModel.create({ 
      name, 
      description, 
      color, 
      icon,
      active
    })

    return NextResponse.json({
      success: true,
      data: newUnit,
      message: 'Unit created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to create unit'
      },
      { status: 500 }
    )
  }
}