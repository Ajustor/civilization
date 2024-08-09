import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'

const sqlite = new Database('civ-simulator.sqlite')

export const db = drizzle(sqlite)


