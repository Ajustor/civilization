import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { ResourceTypes } from '@ajustor/simulation'
import { civilizationTable } from './civilizations'
import { createId } from '@paralleldrive/cuid2'

export const civilizationsResourcesTable = sqliteTable('civilizations_resources', {
  id: text('id').primaryKey().$defaultFn(createId),
  civilizationId: text('civilizationId').references(() => civilizationTable.id),
  resourceType: text('type', { enum: [ResourceTypes.FOOD, ResourceTypes.WOOD, ResourceTypes.STONE] }).notNull(),
  quantity: int('quantity').default(0).notNull()
})