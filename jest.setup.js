// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Import @testing-library/jest-dom for component tests
require('@testing-library/jest-dom')

// Mock environment variables for testing
process.env.DATABASE_URL = './data_test.db'

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