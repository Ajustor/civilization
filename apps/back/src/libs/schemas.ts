import { sqliteTable, integer } from "drizzle-orm/sqlite-core"

export const worldTable = sqliteTable("world", {
  id: integer("id").primaryKey(),
  month: integer("month"),
  year: integer("year"),
})

export type WorldTable = typeof worldTable.$inferSelect