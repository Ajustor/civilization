import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-typebox'
import { Civilization } from '../../src/simulation/civilization'

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  email: text('email').unique().notNull(),
  authorizationKey: text('authorizationKey')
})

export type UserEntity = typeof usersTable.$inferSelect
export type User = Omit<UserEntity, 'password' | 'authorizationKey'>
export type UserWithCivilizations = User & { civilizations: Civilization[] }
export type UserCreation = typeof usersTable.$inferInsert

export const createUser = createInsertSchema(usersTable)