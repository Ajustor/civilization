import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

export const worldsTable = sqliteTable('worlds', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').unique().notNull(),
  month: int('month').default(0).notNull()
})