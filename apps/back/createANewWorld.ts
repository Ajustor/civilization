import { EmailSender } from './src/libs/services/emailSender'
import { ResourceTypes } from '@ajustor/simulation'
import { WorldDestructionEmailTemplate } from './src/emailTemplates/worldDestruction'
import { civilizationTable } from './db/schema/civilizations'
import { civilizationsResourcesTable } from './db/schema/civilizationsResourcesTable'
import { civilizationsWorldTable } from './db/schema/civilizationsWorldsTable'
import { db } from './src/libs/database'
import { usersCivilizationTable } from './db/schema/usersCivilizationsTable'
import { usersTable } from './db/schema/users'
import { worldsResourcesTable } from './db/schema/worldsResourcesTable'
import { worldsTable } from './db/schema/worldSchema'
import { desc } from 'drizzle-orm'

const topCivilizations = await db.select().from(civilizationTable).orderBy(desc(civilizationTable.livedMonths))

await db.delete(worldsResourcesTable)
await db.delete(usersCivilizationTable)
await db.delete(civilizationsResourcesTable)
await db.delete(civilizationsWorldTable)
await db.delete(civilizationTable)
await db.delete(worldsTable)

await db.insert(worldsTable).values([
  { name: 'The Holy kingdom', month: 0 }
])

const worlds = await db.select().from(worldsTable)

await db.insert(worldsResourcesTable).values(worlds.flatMap(({ id }) => {
  return [
    {
      worldId: id,
      resourceType: ResourceTypes.FOOD,
      quantity: 10000
    },
    {
      worldId: id,
      resourceType: ResourceTypes.WOOD,
      quantity: 5000
    },
    {
      worldId: id,
      resourceType: ResourceTypes.STONE,
      quantity: 5000
    }
  ]
}))

console.log(`Seeding complete.`)
console.log('Sending emails')
const emailService = new EmailSender()
const users = await db.select().from(usersTable)
const emails = users.map(({ email }) => email)

await emailService.sendBatch(emails, 'Oh non !', WorldDestructionEmailTemplate({ topCivilizationsNames: topCivilizations.map(({ name }) => name) }))