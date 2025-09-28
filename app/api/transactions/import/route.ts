import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const importTransactions = body.transactions

    console.log('Import API called with', importTransactions?.length, 'transactions')

    if (!importTransactions || !Array.isArray(importTransactions)) {
      console.error('Invalid transaction data:', importTransactions)
      return NextResponse.json(
        { success: false, error: 'Invalid transaction data' },
        { status: 400 }
      )
    }

    let imported = 0
    let skipped = 0
    const errors: any[] = []

    // Process each transaction
    for (const transaction of importTransactions) {
      try {
        console.log('Processing transaction:', transaction)

        // Check for duplicate by hash when provided
        if (transaction.hash) {
          const existing = await transactionsModel.getByHash(String(transaction.hash))
          if (existing) {
            console.log('Skipping duplicate transaction with hash:', transaction.hash)
            skipped++
            continue
          }
        }

        // Delegate creation and normalization to the model
        await transactionsModel.create(transaction)

        imported++
        console.log('Successfully imported transaction', imported)
      } catch (error) {
        console.error('Error importing transaction:', error)
        console.error('Transaction data:', transaction)
        errors.push({ transaction, error: String(error) })
        // Continue with next transaction
      }
    }

    console.log('Import complete:', { imported, skipped, total: importTransactions.length, errors: errors.length })

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: importTransactions.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import transactions', details: String(error) },
      { status: 500 }
    )
  }
}
