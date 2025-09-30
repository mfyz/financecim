import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { rulesModel } from '@/db/models/rules.model'
import { importLogModel } from '@/db/models/import-log.model'
import { CSVParser, ColumnMapping } from '@/lib/csv-parser'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sourceIdStr = formData.get('sourceId') as string | null
    const mappingStr = formData.get('mapping') as string | null
    const applyRules = formData.get('applyRules') === 'true'

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sourceIdStr) {
      return NextResponse.json(
        { success: false, error: 'Source ID is required' },
        { status: 400 }
      )
    }

    const sourceId = parseInt(sourceIdStr)
    if (isNaN(sourceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source ID' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      )
    }

    // Initialize CSV parser
    const parser = new CSVParser()

    // Parse or auto-detect column mapping
    let mapping: ColumnMapping
    if (mappingStr) {
      try {
        mapping = JSON.parse(mappingStr)
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid column mapping' },
          { status: 400 }
        )
      }
    } else {
      // Auto-detect mapping from headers
      const headers = parser.parseHeaders(content)
      mapping = parser.autoDetectMapping(headers)

      // Validate auto-detected mapping
      if (mapping.date === -1 || mapping.description === -1 || mapping.amount === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not auto-detect required columns. Please provide manual mapping.',
            detectedMapping: mapping,
            headers: headers
          },
          { status: 400 }
        )
      }
    }

    // Parse transactions
    const { transactions: parsedTransactions, errors: parseErrors } = parser.parseTransactions(
      content,
      mapping,
      sourceId
    )

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid transactions found in file',
          parseErrors: parseErrors
        },
        { status: 400 }
      )
    }

    // Process transactions with auto-categorization
    let imported = 0
    let skipped = 0
    let updated = 0
    const importErrors: any[] = []
    const processedTransactions: any[] = []

    for (const parsed of parsedTransactions) {
      try {
        // Check for existing transaction by hash
        const existing = await transactionsModel.getByHash(parsed.hash)

        if (existing) {
          skipped++
          continue
        }

        // Prepare transaction data
        const transactionData: any = {
          source_id: sourceId,
          date: new Date(parsed.date),
          description: parsed.description,
          amount: parsed.amount,
          source_category: parsed.source_category || null,
          notes: parsed.notes || null,
          hash: parsed.hash
        }

        // Apply auto-categorization rules if enabled
        if (applyRules) {
          // Apply unit rules
          const unitRule = await rulesModel.applyUnitRules({
            source_id: sourceId,
            description: parsed.description
          })
          if (unitRule) {
            transactionData.unit_id = unitRule
          }

          // Apply category rules
          const categoryRule = await rulesModel.applyCategoryRules({
            description: parsed.description,
            source_category: parsed.source_category
          })
          if (categoryRule) {
            transactionData.category_id = categoryRule
          }
        }

        // Create transaction
        const created = await transactionsModel.create(transactionData)
        imported++
        processedTransactions.push(created)

      } catch (error) {
        console.error('Error processing transaction:', error)
        importErrors.push({
          transaction: parsed,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Log import to database
    const importLog = await importLogModel.logImport({
      source_id: sourceId,
      file_name: file.name,
      transactions_added: imported,
      transactions_skipped: skipped,
      transactions_updated: updated,
      status: importErrors.length > 0 ? 'partial' : 'success',
      metadata: {
        totalInFile: parsedTransactions.length,
        parseErrors: parseErrors.length,
        importErrors: importErrors.length,
        mapping: mapping,
        applyRules: applyRules
      }
    })

    // Return results
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      updated,
      total: parsedTransactions.length,
      importLogId: importLog.id,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      importErrors: importErrors.length > 0 ? importErrors : undefined,
      transactions: processedTransactions.slice(0, 10) // Return first 10 for preview
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import CSV',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Endpoint to preview CSV without importing
export async function PUT(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mappingStr = formData.get('mapping') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      )
    }

    // Initialize CSV parser
    const parser = new CSVParser()

    // Get headers
    const headers = parser.parseHeaders(content)

    // Parse or auto-detect column mapping
    let mapping: ColumnMapping
    if (mappingStr) {
      mapping = JSON.parse(mappingStr)
    } else {
      mapping = parser.autoDetectMapping(headers)
    }

    // Parse first 20 rows for preview (dummy sourceId for hash generation)
    const { transactions: previewTransactions, errors } = parser.parseTransactions(
      content.split('\n').slice(0, 21).join('\n'), // First 20 rows + header
      mapping,
      0
    )

    // Apply auto-categorization rules for preview
    const previewWithRules = []
    for (const transaction of previewTransactions.slice(0, 10)) {
      const preview: any = { ...transaction }

      // Try to apply rules (read-only)
      try {
        const unitRule = await rulesModel.applyUnitRules({
          source_id: 0,
          description: transaction.description
        })
        if (unitRule) {
          preview.suggested_unit_id = unitRule
        }

        const categoryRule = await rulesModel.applyCategoryRules({
          description: transaction.description,
          source_category: transaction.source_category
        })
        if (categoryRule) {
          preview.suggested_category_id = categoryRule
        }
      } catch (error) {
        // Ignore errors in preview
      }

      previewWithRules.push(preview)
    }

    return NextResponse.json({
      success: true,
      headers,
      mapping,
      totalRows: content.trim().split('\n').length - 1, // Exclude header
      preview: previewWithRules,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('CSV preview error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to preview CSV',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}