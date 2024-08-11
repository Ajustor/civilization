import { createId } from '@paralleldrive/cuid2'
import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { Building } from '../../src/simulation/buildings/buildings.type'
import { Citizen } from '../../src/simulation/citizen/citizen'

export const civilizationTable = sqliteTable('civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  buildings: blob('buildings', { mode: 'json' }).notNull().default([]).$type<Building[]>(),
  citizens: blob('citizens', { mode: 'json' }).notNull().default([]).$type<Citizen[]>()
})