import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from './src/libs/database'

await migrate(db, { migrationsFolder: './drizzle' })
