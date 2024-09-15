import { BuildingType, PeopleEntity, } from '@ajustor/simulation'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createId } from '@paralleldrive/cuid2'

export const civilizationTable = sqliteTable('civilizations', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  livedMonths: int('livedMonths').notNull().default(0),
  buildings: text('buildings', { mode: 'json' }).notNull().$type<BuildingType[]>().$default(() => []),
  people: text('people', { mode: 'json' }).notNull().$type<PeopleEntity[]>().$default(() => [])
})

export type CivilizationEntity = typeof civilizationTable.$inferSelect