import crypto from 'crypto'

/**
 * Generate a stable transaction hash for duplicate detection.
 * Hash is based on sourceId, date (YYYY-MM-DD), description, and amount (fixed 2 decimals).
 * Returns first 16 hex chars of sha256.
 */
export function transactionHash(
  sourceId: number,
  date: string,
  description: string,
  amount: number
): string {
  const data = `${sourceId}|${date}|${description}|${amount.toFixed(2)}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

