import { BuildingType, CitizenEntity } from '@ajustor/simulation'
import { createId } from '@paralleldrive/cuid2'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const civilizationTable = sqliteTable('civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  livedMonths: int('livedMonths').notNull().default(0),
  buildings: text('buildings', { mode: 'json' }).notNull().$type<BuildingType[]>().$default(() => []),
  citizens: text('citizens', { mode: 'json' }).notNull().$type<CitizenEntity[]>().$default(() => [])
})

export type CivilizationEntity = typeof civilizationTable.$inferSelect