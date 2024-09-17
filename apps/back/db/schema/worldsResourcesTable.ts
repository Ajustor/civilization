import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { ResourceTypes } from '@ajustor/simulation'
import { createId } from '@paralleldrive/cuid2'
import { worldsTable } from './worldSchema'

export const worldsResourcesTable = sqliteTable('worlds_resources', {
  id: text('id').primaryKey().$defaultFn(createId),
  worldId: text('worldId').references(() => worldsTable.id),
  resourceType: text('type', { enum: [ResourceTypes.FOOD, ResourceTypes.WOOD, ResourceTypes.STONE] }).notNull(),
  quantity: int('quantity').default(0).notNull()
})