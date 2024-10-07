import { eq } from 'drizzle-orm'
import { usersCivilizationTable } from './db/schema/usersCivilizationsTable'
import { db } from './src/libs/database'

const oldUserId = 'a6zfctghw0e8yrkyknf3n2ld'
const newUserId = 'ljuzdwbxsgwnmqk9vu0lzvaa'

await db.update(usersCivilizationTable).set({userId: newUserId}).where(eq(usersCivilizationTable.userId, oldUserId))