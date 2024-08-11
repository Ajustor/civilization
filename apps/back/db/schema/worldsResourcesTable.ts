import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core'
import { worldsTable } from './worldSchema'
import { ResourceType } from '../../src/simulation/resource'

export const worldsResourcesTable = sqliteTable('worlds_resources', {
  id: text('id').primaryKey().$defaultFn(createId),
  worldId: text('worldId').references(() => worldsTable.id),
  resourceType: text('type', { enum: [ResourceType.FOOD, ResourceType.WOOD] }).notNull(),
  quantity: int('quantity').default(0).notNull()
})