import { type Transaction } from '@/db/schema'
import { transactionHash } from '@/lib/hash'

export interface CSVColumn {
  index: number
  header: string
  field: keyof Transaction | null
}

export interface ColumnMapping {
  date: number
  description: number
  amount: number
  sourceCategory?: number
  notes?: number
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  source_category?: string
  notes?: string
  hash: string
}

export class CSVParser {
  private delimiter: string = ','
  private hasHeader: boolean = true

  constructor(options?: { delimiter?: string; hasHeader?: boolean }) {
    if (options?.delimiter) this.delimiter = options.delimiter
    if (options?.hasHeader !== undefined) this.hasHeader = options.hasHeader
  }

  /**
   * Parse CSV content and extract headers
   */
  parseHeaders(content: string): string[] {
    const trimmed = content.trim()
    if (!trimmed) return []

    const lines = trimmed.split('\n')
    if (lines.length === 0) return []

    const firstLine = lines[0]
    return this.parseLine(firstLine)
  }

  /**
   * Parse a single CSV line
   */
  private parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === this.delimiter && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  /**
   * Parse CSV content with column mapping
   */
  parseTransactions(
    content: string,
    mapping: ColumnMapping,
    sourceId: number
  ): { transactions: ParsedTransaction[]; errors: string[] } {
    const lines = content.trim().split('\n')
    const errors: string[] = []
    const transactions: ParsedTransaction[] = []

    // Skip header if present
    const startLine = this.hasHeader ? 1 : 0

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const fields = this.parseLine(line)

        // Extract mapped fields
        const date = fields[mapping.date]?.trim()
        const description = fields[mapping.description]?.trim()
        const amountStr = fields[mapping.amount]?.trim()

        // Validate required fields
        if (!date || !description || !amountStr) {
          errors.push(`Line ${i + 1}: Missing required fields (date, description, or amount)`)
          continue
        }

        // Parse amount
        const amount = this.parseAmount(amountStr)
        if (isNaN(amount)) {
          errors.push(`Line ${i + 1}: Invalid amount: ${amountStr}`)
          continue
        }

        // Parse date
        const parsedDate = this.parseDate(date)
        if (!parsedDate) {
          errors.push(`Line ${i + 1}: Invalid date: ${date}`)
          continue
        }

        // Create transaction hash for duplicate detection
        const hash = this.generateHash(sourceId, parsedDate, description, amount)

        // Build transaction
        const transaction: ParsedTransaction = {
          date: parsedDate,
          description: description,
          amount: amount,
          hash: hash
        }

        // Add optional fields
        if (mapping.sourceCategory !== undefined && fields[mapping.sourceCategory]) {
          transaction.source_category = fields[mapping.sourceCategory].trim()
        }
        if (mapping.notes !== undefined && fields[mapping.notes]) {
          transaction.notes = fields[mapping.notes].trim()
        }

        transactions.push(transaction)
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error}`)
      }
    }

    return { transactions, errors }
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    // Remove currency symbols and whitespace
    let cleaned = amountStr.replace(/[$£€¥\s]/g, '').trim()

    // Handle parentheses for negative numbers
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1)
    }

    // Determine decimal separator format
    // Count dots and commas
    const dots = (cleaned.match(/\./g) || []).length
    const commas = (cleaned.match(/,/g) || []).length

    if (dots === 0 && commas === 0) {
      // No separators, just parse
      return parseFloat(cleaned)
    }

    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')

    if (dots > 0 && commas > 0) {
      // Both separators present
      if (lastComma > lastDot) {
        // European format: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // US format: 1,234.56
        cleaned = cleaned.replace(/,/g, '')
      }
    } else if (commas === 1 && dots === 0) {
      // Only one comma, likely decimal separator (European)
      cleaned = cleaned.replace(',', '.')
    } else if (dots === 1 && commas === 0) {
      // Only one dot, likely decimal separator (US)
      // Already correct
    } else if (commas > 1) {
      // Multiple commas, US thousands separator
      cleaned = cleaned.replace(/,/g, '')
    } else if (dots > 1) {
      // Multiple dots, European thousands separator
      cleaned = cleaned.replace(/\./g, '')
    }

    return parseFloat(cleaned)
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string | null {
    try {
      // Trim the input
      const trimmed = dateStr.trim()

      // ISO format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
      }

      // Try European format DD/MM/YYYY or DD.MM.YYYY
      if (/^\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[\/\.]/)
        const day = parseInt(parts[0])
        const month = parseInt(parts[1])
        const year = parseInt(parts[2])

        // Validate day/month values to determine format
        if (day > 12 && month <= 12) {
          // Definitely DD/MM/YYYY format (day > 12)
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          }
        } else if (month > 12 && day <= 12) {
          // Definitely MM/DD/YYYY format (month value > 12 in position 2)
          const date = new Date(year, day - 1, month)
          if (!isNaN(date.getTime())) {
            return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`
          }
        } else {
          // Ambiguous, try DD/MM/YYYY first (European style)
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month - 1) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          }
        }
      }

      // Try parsing with Date constructor as fallback
      const date = new Date(trimmed)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Generate hash for duplicate detection
   */
  private generateHash(sourceId: number, date: string, description: string, amount: number): string {
    return transactionHash(sourceId, date, description, amount)
  }

  /**
   * Auto-detect column mapping based on headers
   */
  autoDetectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
      date: -1,
      description: -1,
      amount: -1
    }

    // Lowercase headers for comparison
    const lowerHeaders = headers.map(h => h.toLowerCase())

    // Detect date column
    const datePatterns = ['date', 'transaction date', 'trans date', 'posted date', 'datum', 'fecha']
    for (const pattern of datePatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern))
      if (index !== -1) {
        mapping.date = index
        break
      }
    }

    // Detect description column
    const descPatterns = ['description', 'desc', 'merchant', 'payee', 'details', 'beschreibung', 'descripción']
    for (const pattern of descPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern))
      if (index !== -1) {
        mapping.description = index
        break
      }
    }

    // Detect amount column
    const amountPatterns = ['amount', 'value', 'debit', 'charge', 'betrag', 'importe']
    for (const pattern of amountPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern))
      if (index !== -1) {
        mapping.amount = index
        break
      }
    }

    // Detect category column
    const categoryPatterns = ['category', 'type', 'kategorie', 'categoría']
    for (const pattern of categoryPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern))
      if (index !== -1) {
        mapping.sourceCategory = index
        break
      }
    }

    // Detect notes column
    const notesPatterns = ['notes', 'memo', 'comment', 'notizen', 'notas']
    for (const pattern of notesPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern))
      if (index !== -1) {
        mapping.notes = index
        break
      }
    }

    return mapping
  }
}
