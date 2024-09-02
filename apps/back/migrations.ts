import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from './src/libs/database'
import { UsersTable } from './src/modules/users/database'

await migrate(db, { migrationsFolder: './drizzle' })

const usersTable = new UsersTable(db)

console.log('Start adding authorization keys to users')
await usersTable.addAuthorizationKeys()
console.log('Authorization keys added')