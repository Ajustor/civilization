import { drizzle as tursoDrizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const url: string = JSON.parse(Bun.env.LOCAL ?? 'true') ? `file:civ-simulator.sqlite` : `${Bun.env.TURSO_URL}`

export const sqliteClient = createClient({ url, authToken: Bun.env.TURSO_TOKEN })

export const db = tursoDrizzle(sqliteClient)
