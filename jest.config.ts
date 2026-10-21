import type { Config } from 'jest';

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/'],
    coverageProvider: 'v8',
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
        '\\.(gif|ttf|eot|svg|png|jpe?g|webp|lottie)$': '<rootDir>/__mocks__/fileMock.js',
        // The vendored stores package (see tsconfig paths); specs stub it with
        // jest.mock, but jest still needs the specifier to resolve.
        '^@deriv/stores$': '<rootDir>/src/vendor/stores',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    preset: 'ts-jest',
    rootDir: __dirname,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
};

export default config;
