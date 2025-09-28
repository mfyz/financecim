#!/usr/bin/env tsx
import { getDatabase } from './connection'
import { units, sources, categories, transactions, unitRules, categoryRules, importLog } from './schema'

export async function seed() {
  console.log('🌱 Starting database seeding...')

  try {
    const db = getDatabase()

    // Clear existing data in correct order (respecting foreign keys)
    console.log('🧹 Clearing existing data...')
    await db.delete(importLog)
    await db.delete(categoryRules)
    await db.delete(unitRules)
    await db.delete(transactions)
    await db.delete(categories)
    await db.delete(sources)
    await db.delete(units)

    // Seed Units
    console.log('📦 Seeding units...')
    const seedUnits = await db.insert(units).values([
      { name: 'Personal', description: 'Personal expenses and income', color: '#6B7280', icon: '👤', active: true },
      { name: 'Main Business', description: 'Primary business operations', color: '#3B82F6', icon: '💼', active: true },
      { name: 'Side Hustle', description: 'Freelance and consulting work', color: '#10B981', icon: '💡', active: true },
      { name: 'Real Estate', description: 'Rental property income and expenses', color: '#F59E0B', icon: '🏠', active: true },
      { name: 'Investments', description: 'Investment related transactions', color: '#8B5CF6', icon: '📈', active: false }
    ]).returning({ id: units.id })

    // Seed Sources
    console.log('🏦 Seeding sources...')
    const seedSources = await db.insert(sources).values([
      { name: 'Chase Bank', type: 'bank' },
      { name: 'Capital One Credit', type: 'credit_card' },
      { name: 'Wells Fargo Savings', type: 'bank' },
      { name: 'American Express', type: 'credit_card' },
      { name: 'Manual Entry', type: 'manual' },
      { name: 'Citi Bank', type: 'bank' },
      { name: 'Discover Card', type: 'credit_card' }
    ]).returning({ id: sources.id })

    // Seed Categories (with hierarchy)
    console.log('📂 Seeding categories...')
    
    // Parent categories first
    const parentCategories = await db.insert(categories).values([
      { name: 'Housing', parentCategoryId: null, color: '#EF4444', icon: '🏠', monthlyBudget: 2000.00 },
      { name: 'Transportation', parentCategoryId: null, color: '#F97316', icon: '🚗', monthlyBudget: 800.00 },
      { name: 'Food & Dining', parentCategoryId: null, color: '#84CC16', icon: '🍴', monthlyBudget: 600.00 },
      { name: 'Utilities', parentCategoryId: null, color: '#06B6D4', icon: '⚡', monthlyBudget: 300.00 },
      { name: 'Entertainment', parentCategoryId: null, color: '#8B5CF6', icon: '🎬', monthlyBudget: 200.00 },
      { name: 'Healthcare', parentCategoryId: null, color: '#EC4899', icon: '❤️', monthlyBudget: 400.00 },
      { name: 'Shopping', parentCategoryId: null, color: '#F59E0B', icon: '🛍️', monthlyBudget: 500.00 },
      { name: 'Income', parentCategoryId: null, color: '#10B981', icon: '📈', monthlyBudget: null }
    ]).returning({ id: categories.id, name: categories.name })

    // Child categories
    const housingId = parentCategories.find(c => c.name === 'Housing')?.id
    const transportationId = parentCategories.find(c => c.name === 'Transportation')?.id
    const foodId = parentCategories.find(c => c.name === 'Food & Dining')?.id
    const incomeId = parentCategories.find(c => c.name === 'Income')?.id

    await db.insert(categories).values([
      { name: 'Rent', parentCategoryId: housingId, color: '#EF4444', icon: '🔑', monthlyBudget: 1500.00 },
      { name: 'Utilities', parentCategoryId: housingId, color: '#EF4444', icon: '⚡', monthlyBudget: 200.00 },
      { name: 'Gas', parentCategoryId: transportationId, color: '#F97316', icon: '⛽', monthlyBudget: 200.00 },
      { name: 'Public Transit', parentCategoryId: transportationId, color: '#F97316', icon: '🚌', monthlyBudget: 100.00 },
      { name: 'Groceries', parentCategoryId: foodId, color: '#84CC16', icon: '🛒', monthlyBudget: 400.00 },
      { name: 'Restaurants', parentCategoryId: foodId, color: '#84CC16', icon: '🍽️', monthlyBudget: 200.00 },
      { name: 'Salary', parentCategoryId: incomeId, color: '#10B981', icon: '💰', monthlyBudget: null },
      { name: 'Freelance', parentCategoryId: incomeId, color: '#10B981', icon: '💼', monthlyBudget: null }
    ])

    // Get all categories for transactions
    const allCategories = await db.select({ id: categories.id, name: categories.name }).from(categories)

    // Seed Sample Transactions
    console.log('💳 Seeding transactions...')
    const today = new Date()
    const transactions_data = []
    
    // Generate 50 sample transactions over the last 3 months
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90) // Last 90 days
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)
      
      const sourceId = seedSources[Math.floor(Math.random() * seedSources.length)].id
      const unitId = Math.random() > 0.2 ? seedUnits[Math.floor(Math.random() * seedUnits.length)].id : null // 80% have units
      const categoryId = Math.random() > 0.1 ? allCategories[Math.floor(Math.random() * allCategories.length)].id : null // 90% have categories
      
      transactions_data.push({
        sourceId,
        unitId,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        description: getRandomDescription(),
        amount: getRandomAmount(),
        sourceCategory: Math.random() > 0.7 ? getRandomSourceCategory() : null,
        categoryId,
        ignore: Math.random() > 0.95, // 5% ignored
        notes: Math.random() > 0.8 ? getRandomNote() : null,
        tags: Math.random() > 0.6 ? getRandomTags() : null,
      })
    }

    await db.insert(transactions).values(transactions_data)

    // Seed Unit Rules
    console.log('⚙️ Seeding unit rules...')
    const businessUnitId = seedUnits.find(u => u.id)?.id || 1
    const personalUnitId = seedUnits.find(u => u.id)?.id || 1

    await db.insert(unitRules).values([
      { ruleType: 'description', pattern: 'FREELANCE', matchType: 'contains', unitId: businessUnitId, priority: 1, active: true },
      { ruleType: 'description', pattern: 'CONSULTING', matchType: 'contains', unitId: businessUnitId, priority: 2, active: true },
      { ruleType: 'source', pattern: 'Business Checking', matchType: 'contains', unitId: businessUnitId, priority: 3, active: true },
      { ruleType: 'description', pattern: 'GROCERY', matchType: 'contains', unitId: personalUnitId, priority: 4, active: true },
      { ruleType: 'description', pattern: 'RENT', matchType: 'starts_with', unitId: personalUnitId, priority: 5, active: true }
    ])

    // Seed Category Rules
    console.log('🏷️ Seeding category rules...')
    const groceryCategoryId = allCategories.find(c => c.name === 'Groceries')?.id
    const gasCategoryId = allCategories.find(c => c.name === 'Gas')?.id
    const salaryCategoryId = allCategories.find(c => c.name === 'Salary')?.id

    if (groceryCategoryId && gasCategoryId && salaryCategoryId) {
      await db.insert(categoryRules).values([
        { ruleType: 'description', pattern: 'WALMART', matchType: 'contains', categoryId: groceryCategoryId, priority: 1, active: true },
        { ruleType: 'description', pattern: 'KROGER', matchType: 'contains', categoryId: groceryCategoryId, priority: 2, active: true },
        { ruleType: 'description', pattern: 'TARGET', matchType: 'contains', categoryId: groceryCategoryId, priority: 3, active: true },
        { ruleType: 'description', pattern: 'SHELL', matchType: 'contains', categoryId: gasCategoryId, priority: 4, active: true },
        { ruleType: 'description', pattern: 'EXXON', matchType: 'contains', categoryId: gasCategoryId, priority: 5, active: true },
        { ruleType: 'description', pattern: 'PAYROLL', matchType: 'contains', categoryId: salaryCategoryId, priority: 6, active: true }
      ])
    }

    // Seed Import Log
    console.log('📊 Seeding import history...')
    await db.insert(importLog).values([
      {
        sourceId: seedSources[0].id,
        fileName: 'chase_transactions_2024_01.csv',
        transactionsAdded: 45,
        transactionsSkipped: 2,
        transactionsUpdated: 0,
        status: 'success',
        errorMessage: null,
        metadata: JSON.stringify({ headers: ['Date', 'Description', 'Amount'], delimiter: ',' })
      },
      {
        sourceId: seedSources[1].id,
        fileName: 'capital_one_2024_02.csv',
        transactionsAdded: 32,
        transactionsSkipped: 0,
        transactionsUpdated: 3,
        status: 'success',
        errorMessage: null,
        metadata: JSON.stringify({ headers: ['Transaction Date', 'Description', 'Debit', 'Credit'], delimiter: ',' })
      },
      {
        sourceId: seedSources[2].id,
        fileName: 'wells_fargo_export.csv',
        transactionsAdded: 0,
        transactionsSkipped: 0,
        transactionsUpdated: 0,
        status: 'failed',
        errorMessage: 'Invalid date format in row 15',
        metadata: JSON.stringify({ error_row: 15, headers: ['Date', 'Desc', 'Amount'] })
      }
    ])

    console.log('✅ Database seeding completed successfully!')
    console.log(`📊 Seeded:
    - ${seedUnits.length} units
    - ${seedSources.length} sources  
    - ${allCategories.length} categories
    - ${transactions_data.length} transactions
    - 5 unit rules
    - 6 category rules
    - 3 import logs`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    // Only exit if running directly, not when imported
    if (require.main === module) {
      process.exit(1)
    }
    throw error // Re-throw for tests
  }
}

// Helper functions to generate realistic mock data
function getRandomDescription(): string {
  const descriptions = [
    'WALMART SUPERCENTER #1234',
    'SHELL OIL STATION',
    'AMAZON.COM AMZN.COM/BILL',
    'STARBUCKS STORE #5678',
    'McDONALD\'S #9876',
    'TARGET STORE T-1234',
    'KROGER #0567',
    'PAYROLL DEPOSIT',
    'FREELANCE PROJECT PAYMENT',
    'UBER RIDE',
    'NETFLIX.COM',
    'SPOTIFY PREMIUM',
    'ATM WITHDRAWAL',
    'RENT PAYMENT',
    'ELECTRIC BILL AUTOPAY',
    'INTERNET SERVICE',
    'PHONE BILL',
    'INSURANCE PAYMENT',
    'DOCTOR VISIT COPAY',
    'PHARMACY PRESCRIPTION'
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

function getRandomAmount(): number {
  // Mix of income (positive) and expenses (negative)
  const isIncome = Math.random() > 0.85 // 15% income
  const amount = isIncome 
    ? Math.random() * 3000 + 500    // Income: $500-$3500
    : -(Math.random() * 200 + 5)    // Expenses: $5-$205
  return Math.round(amount * 100) / 100 // Round to 2 decimal places
}

function getRandomSourceCategory(): string {
  const sourceCategories = [
    'Merchandise',
    'Gas',
    'Restaurants',
    'Online Services',
    'ATM/Cash',
    'Transfer',
    'Payroll',
    'Healthcare'
  ]
  return sourceCategories[Math.floor(Math.random() * sourceCategories.length)]
}

function getRandomNote(): string {
  const notes = [
    'Business expense',
    'Reimbursable',
    'Split with roommate',
    'Gift for birthday',
    'Emergency purchase',
    'Annual subscription',
    'Work lunch meeting'
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}

function getRandomTags(): string {
  const tagOptions = ['business', 'personal', 'travel', 'emergency', 'subscription', 'gift', 'work', 'health', 'utilities']
  const numTags = Math.random() > 0.7 ? 2 : 1 // 30% have 2 tags, 70% have 1
  const shuffled = tagOptions.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, numTags).join(',')
}

// Run the seeding
if (require.main === module) {
  seed().catch(console.error)
}