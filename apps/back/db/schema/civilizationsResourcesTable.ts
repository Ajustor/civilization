import { createId } from '@paralleldrive/cuid2'
import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core'
import { civilizationTable } from './civilizations'
import { ResourceType } from '../../src/simulation/resource'

export const civilizationsResourcesTable = sqliteTable('civilizations_resources', {
  id: text('id').primaryKey().$defaultFn(createId),
  civilizationId: text('civilizationId').references(() => civilizationTable.id),
  resourceType: text('type', { enum: [ResourceType.FOOD, ResourceType.WOOD] }).notNull(),
  quantity: int('quantity').default(0).notNull()
})