import { drizzle as tursoDrizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const url: string = Bun.env.LOCAL ? `file:civ-simulator.sqlite` : `${Bun.env.TURSO_URL}`

const sqliteClient = createClient({ url, authToken: Bun.env.TURSO_TOKEN })

export const db = tursoDrizzle(sqliteClient)
