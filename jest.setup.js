// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Import @testing-library/jest-dom for component tests
require('@testing-library/jest-dom')

// Mock environment variables for testing
process.env.DATABASE_URL = './data_test.db'

// Suppress noisy database connection logs globally
const originalLog = console.log
global.console.log = (...args) => {
  const message = args[0]
  if (typeof message === 'string') {
    // Suppress database infrastructure logs
    if (message.includes('📁 Using local SQLite') ||
        message.includes('ℹ️  No migrations') ||
        message.includes('✅ Database migrations') ||
        message.includes('🔄 Turso configuration') ||
        message.includes('📝 Will fall back')) {
      return
    }
  }
  // Let other logs through
  originalLog(...args)
}

// Disable global database mock to allow individual test mocking
// jest.mock('@/db/connection', () => ({
//   getDatabase: jest.fn(() => ({
//     select: jest.fn().mockReturnValue({
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       orderBy: jest.fn().mockReturnThis(),
//       limit: jest.fn().mockReturnThis(),
//       all: jest.fn(),
//       get: jest.fn(),
//     }),
//     insert: jest.fn().mockReturnValue({
//       values: jest.fn().mockReturnValue({
//         returning: jest.fn(),
//       }),
//     }),
//     update: jest.fn().mockReturnValue({
//       set: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       returning: jest.fn(),
//     }),
//     delete: jest.fn().mockReturnValue({
//       where: jest.fn().mockReturnThis(),
//     }),
//   })),
//   schema: {
//     sources: {}
//   }
// }))

// Global test timeout
jest.setTimeout(10000)