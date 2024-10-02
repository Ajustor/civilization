// @ts-check
/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'npm',
  reporters: ['clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'off',
  tsconfigFile: 'tsconfig.json',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/**/demo.ts',
  ],
  concurrency: 12,
}

export default config
