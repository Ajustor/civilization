import { civilizationTable } from './db/schema/civilizations'
import { civilizationsResourcesTable } from './db/schema/civilizationsResourcesTable'
import { civilizationsWorldTable } from './db/schema/civilizationsWorldsTable'
import { usersCivilizationTable } from './db/schema/usersCivilizationsTable'
import { worldsTable } from './db/schema/worldSchema'
import { worldsResourcesTable } from './db/schema/worldsResourcesTable'
import { db } from './src/libs/database'
import { ResourceType } from './src/simulation/resource'

await db.delete(worldsTable)
await db.delete(worldsResourcesTable)
await db.delete(usersCivilizationTable)
await db.delete(civilizationTable)
await db.delete(civilizationsResourcesTable)
await db.delete(civilizationsWorldTable)

await db.insert(worldsTable).values([
  { name: 'The Holy kingdom', month: 0 }
])

const worlds = await db.select().from(worldsTable)

await db.insert(worldsResourcesTable).values(worlds.flatMap(({ id }) => {
  return [
    {
      worldId: id,
      resourceType: ResourceType.FOOD,
      quantity: 10000
    },
    {
      worldId: id,
      resourceType: ResourceType.WOOD,
      quantity: 5000
    }
  ]
}))

console.log(`Seeding complete.`)