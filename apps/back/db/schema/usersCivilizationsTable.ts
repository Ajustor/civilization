import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { usersTable } from './users'
import { civilizationTable } from './civilizations'
import { createId } from '@paralleldrive/cuid2'

export const usersCivilizationTable = sqliteTable('users_civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('userId').references(() => usersTable.id),
  civilizationId: text('civilizationId').references(() => civilizationTable.id)
})