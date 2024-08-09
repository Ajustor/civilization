import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { worldsTable } from '../../../db/schema/worldSchema'
import { worldsResourcesTable } from '../../../db/schema/worldsResourcesTable'
import { and, eq } from 'drizzle-orm'
import { World } from '../../simulation/world'
import { ResourceType } from '../../simulation/resource'

export class WorldsTable {
  constructor(private readonly client: BunSQLiteDatabase) {

  }

  async getAll(): Promise<World[]> {
    const worlds = await this.client
      .select()
      .from(worldsTable)

    const results: World[] = []

    for (const world of worlds) {
      const worldResources = await this.client.select().from(worldsResourcesTable).where(eq(worldsResourcesTable.worldId, world.id)).groupBy(worldsResourcesTable.worldId, worldsResourcesTable.resourceType)
      const woodResource = worldResources.find(({ resourceType }) => resourceType === ResourceType.WOOD)
      const foodResource = worldResources.find(({ resourceType }) => resourceType === ResourceType.FOOD)
      results.push(new World(world.name, world.month, foodResource?.quantity, woodResource?.quantity))
    }

    return results
  }

  async saveAll(worlds: World[]) {
    console.log('save worlds', worlds)
    for (const world of worlds) {
      const { name, month, resources } = world.getInfos()
      const [dbEntity] = await this.client.select().from(worldsTable).where(eq(worldsTable.name, name)).limit(1)
      if (!dbEntity) {
        console.warn('No entity for world', { world })
        continue
      }

      for (const resource of resources) {
        await this.client.update(worldsResourcesTable).set({
          quantity: resource.quantity
        }).where(and(
          eq(worldsResourcesTable.worldId, dbEntity.id),
          eq(worldsResourcesTable.resourceType, resource.type),
        ))
      }
      await this.client.update(worldsTable).set({
        month
      }).where(eq(worldsTable.id, dbEntity.id))
    }
  }
}