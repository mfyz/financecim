import { getDatabase } from '../connection'
import { importLog, type ImportLog, type NewImportLog } from '../schema'
import { eq, desc } from 'drizzle-orm'

const db = getDatabase()

export const importLogModel = {
  async getAll() {
    try {
      const logs = await db.select().from(importLog).orderBy(desc(importLog.importDate))
      return logs
    } catch (error) {
      console.error('Error fetching import logs:', error)
      throw new Error('Failed to fetch import logs')
    }
  },

  /**
   * Convenience logger to accept snake_case keys from legacy callers
   */
  async logImport(data: {
    source_id: number
    file_name?: string
    transactions_added: number
    transactions_skipped?: number
    transactions_updated?: number
    status: 'success' | 'partial' | 'failed'
    error_message?: string
    metadata?: any
  }) {
    const mapped: NewImportLog = {
      sourceId: data.source_id,
      fileName: data.file_name,
      transactionsAdded: data.transactions_added ?? 0,
      transactionsSkipped: data.transactions_skipped ?? 0,
      transactionsUpdated: data.transactions_updated ?? 0,
      status: data.status,
      errorMessage: data.error_message,
      metadata: data.metadata,
    }
    return this.create(mapped)
  },

  async getById(id: number) {
    try {
      const [log] = await db.select().from(importLog).where(eq(importLog.id, id)).limit(1)
      return log || null
    } catch (error) {
      console.error('Error fetching import log:', error)
      throw new Error('Failed to fetch import log')
    }
  },

  async getBySourceId(sourceId: number) {
    try {
      const logs = await db.select()
        .from(importLog)
        .where(eq(importLog.sourceId, sourceId))
        .orderBy(desc(importLog.importDate))
      return logs
    } catch (error) {
      console.error('Error fetching import logs by source:', error)
      throw new Error('Failed to fetch import logs by source')
    }
  },

  async create(data: NewImportLog) {
    try {
      // If metadata is an object, stringify it
      const processedData = {
        ...data,
        metadata: typeof data.metadata === 'object'
          ? JSON.stringify(data.metadata)
          : data.metadata
      }

      const [log] = await db.insert(importLog).values(processedData).returning()
      return log
    } catch (error) {
      console.error('Error creating import log:', error)
      throw new Error('Failed to create import log')
    }
  },

  async update(id: number, data: Partial<NewImportLog>) {
    try {
      // If metadata is an object, stringify it
      const processedData = {
        ...data,
        metadata: data.metadata && typeof data.metadata === 'object'
          ? JSON.stringify(data.metadata)
          : data.metadata
      }

      const [log] = await db.update(importLog)
        .set(processedData)
        .where(eq(importLog.id, id))
        .returning()

      return log || null
    } catch (error) {
      console.error('Error updating import log:', error)
      throw new Error('Failed to update import log')
    }
  },

  async delete(id: number) {
    try {
      const [deleted] = await db.delete(importLog).where(eq(importLog.id, id)).returning()
      return deleted || null
    } catch (error) {
      console.error('Error deleting import log:', error)
      throw new Error('Failed to delete import log')
    }
  },

  async getRecentImports(limit: number = 10) {
    try {
      const logs = await db.select()
        .from(importLog)
        .orderBy(desc(importLog.importDate))
        .limit(limit)
      return logs
    } catch (error) {
      console.error('Error fetching recent imports:', error)
      throw new Error('Failed to fetch recent imports')
    }
  },

  async getImportStats() {
    try {
      const logs = await db.select().from(importLog)

      const stats = {
        totalImports: logs.length,
        successfulImports: logs.filter((log: ImportLog) => log.status === 'success').length,
        failedImports: logs.filter((log: ImportLog) => log.status === 'failed').length,
        partialImports: logs.filter((log: ImportLog) => log.status === 'partial').length,
        totalTransactionsImported: logs.reduce((sum: number, log: ImportLog) =>
          sum + (log.transactionsAdded || 0) + (log.transactionsUpdated || 0), 0),
        totalTransactionsSkipped: logs.reduce((sum: number, log: ImportLog) =>
          sum + (log.transactionsSkipped || 0), 0)
      }

      return stats
    } catch (error) {
      console.error('Error calculating import stats:', error)
      throw new Error('Failed to calculate import stats')
    }
  },

  // Helper method to log a successful import
  async logSuccessfulImport({
    sourceId,
    fileName,
    transactionsAdded,
    transactionsSkipped = 0,
    transactionsUpdated = 0,
    metadata
  }: {
    sourceId: number
    fileName?: string
    transactionsAdded: number
    transactionsSkipped?: number
    transactionsUpdated?: number
    metadata?: any
  }) {
    return this.create({
      sourceId,
      fileName,
      transactionsAdded,
      transactionsSkipped,
      transactionsUpdated,
      status: 'success',
      metadata
    })
  },

  // Helper method to log a failed import
  async logFailedImport({
    sourceId,
    fileName,
    errorMessage,
    metadata
  }: {
    sourceId: number
    fileName?: string
    errorMessage: string
    metadata?: any
  }) {
    return this.create({
      sourceId,
      fileName,
      transactionsAdded: 0,
      transactionsSkipped: 0,
      transactionsUpdated: 0,
      status: 'failed',
      errorMessage,
      metadata
    })
  },

  // Helper method to log a partial import
  async logPartialImport({
    sourceId,
    fileName,
    transactionsAdded = 0,
    transactionsSkipped = 0,
    transactionsUpdated = 0,
    errorMessage,
    metadata
  }: {
    sourceId: number
    fileName?: string
    transactionsAdded?: number
    transactionsSkipped?: number
    transactionsUpdated?: number
    errorMessage?: string
    metadata?: any
  }) {
    return this.create({
      sourceId,
      fileName,
      transactionsAdded,
      transactionsSkipped,
      transactionsUpdated,
      status: 'partial',
      errorMessage,
      metadata
    })
  }
}
