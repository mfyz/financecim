import { sqliteTable, text, integer, real, foreignKey, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Units table
export const units = sqliteTable('units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  icon: text('icon'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// Sources table
export const sources = sqliteTable('sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['bank', 'credit_card', 'manual'] }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// Categories table (self-referencing for hierarchy)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parentCategoryId: integer('parent_category_id'),
  color: text('color').notNull(),
  icon: text('icon'),
  monthlyBudget: real('monthly_budget'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  parentReference: foreignKey({
    columns: [table.parentCategoryId],
    foreignColumns: [table.id],
  }),
}))

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: integer('source_id').notNull(),
  unitId: integer('unit_id'),
  date: text('date').notNull(), // Store as ISO date string
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  sourceCategory: text('source_category'),
  categoryId: integer('category_id'),
  ignore: integer('ignore', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  tags: text('tags'), // Comma-separated tags
  hash: text('hash'), // Hash for duplicate detection
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  sourceReference: foreignKey({
    columns: [table.sourceId],
    foreignColumns: [sources.id],
  }),
  unitReference: foreignKey({
    columns: [table.unitId],
    foreignColumns: [units.id],
  }),
  categoryReference: foreignKey({
    columns: [table.categoryId],
    foreignColumns: [categories.id],
  }),
}))

// Unit Rules table
export const unitRules = sqliteTable('unit_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ruleType: text('rule_type', { enum: ['source', 'description'] }).notNull(),
  pattern: text('pattern').notNull(),
  matchType: text('match_type', { enum: ['contains', 'starts_with', 'exact', 'regex'] }).notNull(),
  unitId: integer('unit_id').notNull(),
  priority: integer('priority').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  unitReference: foreignKey({
    columns: [table.unitId],
    foreignColumns: [units.id],
  }),
}))

// Category Rules table
export const categoryRules = sqliteTable('category_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ruleType: text('rule_type', { enum: ['description', 'source_category'] }).notNull(),
  pattern: text('pattern').notNull(),
  matchType: text('match_type', { enum: ['contains', 'starts_with', 'exact', 'regex'] }).notNull(),
  categoryId: integer('category_id').notNull(),
  priority: integer('priority').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  categoryReference: foreignKey({
    columns: [table.categoryId],
    foreignColumns: [categories.id],
  }),
}))

// Import Log table
export const importLog = sqliteTable('import_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: integer('source_id').notNull(),
  importDate: text('import_date').default(sql`CURRENT_TIMESTAMP`),
  fileName: text('file_name'),
  transactionsAdded: integer('transactions_added').default(0),
  transactionsSkipped: integer('transactions_skipped').default(0),
  transactionsUpdated: integer('transactions_updated').default(0),
  status: text('status', { enum: ['success', 'partial', 'failed'] }).notNull(),
  errorMessage: text('error_message'),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  sourceReference: foreignKey({
    columns: [table.sourceId],
    foreignColumns: [sources.id],
  }),
}))

// Export types for TypeScript
export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
export type Source = typeof sources.$inferSelect
export type NewSource = typeof sources.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type UnitRule = typeof unitRules.$inferSelect
export type NewUnitRule = typeof unitRules.$inferInsert
export type CategoryRule = typeof categoryRules.$inferSelect
export type NewCategoryRule = typeof categoryRules.$inferInsert
export type ImportLog = typeof importLog.$inferSelect
export type NewImportLog = typeof importLog.$inferInsert