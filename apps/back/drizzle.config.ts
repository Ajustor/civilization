import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/**/*.ts',
  out: './drizzle',
  dialect: 'sqlite', // 'postgresql' | 'mysql' | 'sqlite'
  verbose: true,
  strict: true,
})