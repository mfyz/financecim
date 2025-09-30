import { NextResponse } from 'next/server'
import { getDatabase } from '@/db/connection'
import {
  transactions,
  categories,
  sources,
  units,
  unitRules,
  categoryRules,
  importLog
} from '@/db/schema'
import { sql } from 'drizzle-orm'

const db = getDatabase()

const tableMap = {
  transactions,
  categories,
  sources,
  units,
  unit_rules: unitRules,
  category_rules: categoryRules,
  import_log: importLog,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tables } = body as { tables: string[] }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of tables to clean' },
        { status: 400 }
      )
    }

    // Validate all table names
    for (const tableName of tables) {
      if (!tableMap[tableName as keyof typeof tableMap]) {
        return NextResponse.json(
          { error: `Invalid table name: ${tableName}` },
          { status: 400 }
        )
      }
    }

    let totalDeleted = 0
    const deletedTables: string[] = []

    // Delete data from each table
    // Order matters for foreign key constraints - delete children first
    const orderedTables = [
      'import_log',
      'transactions',
      'unit_rules',
      'category_rules',
      'categories',
      'sources',
      'units',
    ]

    for (const tableName of orderedTables) {
      if (tables.includes(tableName)) {
        const table = tableMap[tableName as keyof typeof tableMap]

        // Get count before deletion
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(table)
        const count = countResult[0]?.count || 0

        // Delete all records
        await db.delete(table)

        totalDeleted += count
        deletedTables.push(tableName)
      }
    }

    return NextResponse.json({
      success: true,
      tables: deletedTables,
      deletedCount: totalDeleted,
      message: `Successfully deleted ${totalDeleted} records from ${deletedTables.length} table(s)`,
    })
  } catch (error) {
    console.error('Error cleaning data:', error)
    return NextResponse.json(
      {
        error: 'Failed to clean data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}