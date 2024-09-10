import { ResourceTypes } from '@ajustor/simulation'
import { civilizationTable } from './db/schema/civilizations'
import { civilizationsResourcesTable } from './db/schema/civilizationsResourcesTable'
import { civilizationsWorldTable } from './db/schema/civilizationsWorldsTable'
import { db } from './src/libs/database'
import { usersCivilizationTable } from './db/schema/usersCivilizationsTable'
import { worldsResourcesTable } from './db/schema/worldsResourcesTable'
import { worldsTable } from './db/schema/worldSchema'

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
      resourceType: ResourceTypes.FOOD,
      quantity: 10000
    },
    {
      worldId: id,
      resourceType: ResourceTypes.WOOD,
      quantity: 5000
    }
  ]
}))

console.log(`Seeding complete.`)