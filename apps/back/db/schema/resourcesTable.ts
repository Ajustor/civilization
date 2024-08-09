import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { ResourceType } from '../../src/simulation/resource'

export const resourcesTable = sqliteTable('resources', {
  type: text('type', { enum: [ResourceType.FOOD, ResourceType.WOOD] }).primaryKey().notNull()
})