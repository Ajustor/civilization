import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { civilizationTable } from './civilizations'
import { worldsTable } from './worldSchema'

export const civilizationsWorldTable = sqliteTable('civilizations_worlds', {
  id: text('id').primaryKey().$defaultFn(createId),
  civilizationId: text('civilizationId').references(() => civilizationTable.id),
  worldId: text('worldId').references(() => worldsTable.id)
})