import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  forceExit: true,
  detectOpenHandles: true,
  // Increase timeout for database operations
  testTimeout: 30000,
};

export default config;
