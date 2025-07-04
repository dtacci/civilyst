const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx,ts,tsx}',
    '!src/components/**/*.stories.{js,jsx,ts,tsx}',
    '!src/components/**/index.{js,jsx,ts,tsx}',
  ],
  // Add polyfills for Node.js globals that React Email needs
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  // Transform ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(superjson|@radix-ui|uncrypto|@upstash)/)',
  ],
  // Mock problematic modules
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^superjson$': '<rootDir>/__mocks__/superjson.js',
    '^@upstash/redis$': '<rootDir>/__mocks__/@upstash/redis.js',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
