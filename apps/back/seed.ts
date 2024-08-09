import { resourcesTable } from './db/schema/resourcesTable'
import { worldsTable } from './db/schema/worldSchema'
import { worldsResourcesTable } from './db/schema/worldsResourcesTable'
import { db } from './src/libs/database'
import { ResourceType } from './src/simulation/resource'

await db.delete(worldsTable)
await db.delete(resourcesTable)
await db.delete(worldsResourcesTable)

await db.insert(worldsTable).values([
  { name: 'The Holy kingdom', month: 0 }
])

await db.insert(resourcesTable).values([
  { type: ResourceType.FOOD },
  { type: ResourceType.WOOD }
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