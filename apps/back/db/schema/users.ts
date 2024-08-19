import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-typebox'

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  email: text('email').unique().notNull(),
})

export type UserEntity = typeof usersTable.$inferSelect
export type UserCreation = typeof usersTable.$inferInsert

export const createUser = createInsertSchema(usersTable)