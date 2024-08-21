import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { BuildingEntity } from '../../src/simulation/buildings/buildings.type'
import { CitizenEntity } from '../../src/simulation/citizen/citizen'

export const civilizationTable = sqliteTable('civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  buildings: text('buildings', { mode: 'json' }).notNull().$type<BuildingEntity[]>().$default(() => []),
  citizens: text('citizens', { mode: 'json' }).notNull().$type<CitizenEntity[]>().$default(() => [])
})

export type CivilizationEntity = typeof civilizationTable.$inferSelect