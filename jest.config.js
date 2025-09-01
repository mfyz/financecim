const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  verbose: true,
  testEnvironment: 'jsdom', // Default to jsdom for React component testing
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,

  // Coverage configuration
  collectCoverage: false, // Only collect when explicitly requested
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'db/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/migrations/**',
    '!**/DELETE_*/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!db/seed.ts',
    '!db/DELETE_*',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Module path mapping
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/db/(.*)$': '<rootDir>/db/$1',
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (though we don't need this for API tests)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Test file patterns - include both API and component tests
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/DELETE_node_modules/',
    '/.next/',
    '/DELETE_.*\\.test\\.(ts|tsx)$',
  ],

  // Module paths to ignore
  modulePathIgnorePatterns: ['/DELETE_node_modules/', '/DELETE_package-lock.json'],

  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // Transform configuration for Next.js
  transformIgnorePatterns: [
    '/node_modules/(?!(next|@next|drizzle-orm|better-sqlite3))/',
  ],

  // Coverage threshold
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)