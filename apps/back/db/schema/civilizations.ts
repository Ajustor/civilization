import { createId } from '@paralleldrive/cuid2'
import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { BuildingEntity } from '../../src/simulation/buildings/buildings.type'
import { CitizenEntity } from '../../src/simulation/citizen/citizen'

export const civilizationTable = sqliteTable('civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  buildings: blob('buildings', { mode: 'json' }).notNull().default([]).$type<BuildingEntity[]>(),
  citizens: blob('citizens', { mode: 'json' }).notNull().default([]).$type<CitizenEntity[]>()
})

export type CivilizationEntity = typeof civilizationTable.$inferSelect