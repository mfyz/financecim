import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/db/connection'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase()
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

        // Check for duplicate by hash
        if (transaction.hash) {
          const existing = await db
            .select()
            .from(transactions)
            .where(eq(transactions.hash, transaction.hash))
            .limit(1)

          if (existing.length > 0) {
            console.log('Skipping duplicate transaction with hash:', transaction.hash)
            skipped++
            continue
          }
        }

        // Prepare transaction data
        const transactionData = {
          date: new Date(transaction.date),
          description: transaction.description || '',
          amount: parseFloat(String(transaction.amount)),
          source_id: parseInt(String(transaction.source_id)),
          category_id: transaction.category_id ? parseInt(String(transaction.category_id)) : null,
          unit_id: transaction.unit_id ? parseInt(String(transaction.unit_id)) : 1,
          source_data: transaction.source_data || {},
          hash: transaction.hash || null,
          is_ignored: false,
          notes: null,
          tags: null,
          created_at: new Date(),
          updated_at: new Date()
        }

        console.log('Inserting transaction:', transactionData)

        // Insert transaction
        await db.insert(transactions).values(transactionData)

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