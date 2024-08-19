import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

export class WorldService {
  constructor(private readonly database: BunSQLiteDatabase) {

  }
}