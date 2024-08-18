import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { civilizationTable } from './civilizations'
import { createInsertSchema } from 'drizzle-typebox'

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  email: text('email').unique().notNull(),
  civilizations: text('civilizationsId').references(() => civilizationTable.id)
})

export type UserEntity = typeof usersTable.$inferSelect
export type UserCreation = typeof usersTable.$inferInsert

export const createUser = createInsertSchema(usersTable)