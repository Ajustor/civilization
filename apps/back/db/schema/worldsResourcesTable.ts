import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core'
import { worldsTable } from './worldSchema'
import { ResourceTypes } from '@ajustor/simulation'

export const worldsResourcesTable = sqliteTable('worlds_resources', {
  id: text('id').primaryKey().$defaultFn(createId),
  worldId: text('worldId').references(() => worldsTable.id),
  resourceType: text('type', { enum: [ResourceTypes.FOOD, ResourceTypes.WOOD] }).notNull(),
  quantity: int('quantity').default(0).notNull()
})