import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { worldsTable } from '../../../db/schema/worldSchema'
import { worldsResourcesTable } from '../../../db/schema/worldsResourcesTable'
import { and, eq } from 'drizzle-orm'
import { World } from '../../simulation/world'
import { Resource } from '../../simulation/resource'
import { WorldBuilder } from '../../simulation/builders/worldBuilder'

export type GetOptions = {
  populate: {
    resources: boolean
  }
}

export class WorldsTable {
  constructor(private readonly client: BunSQLiteDatabase) {

  }

  async getAll(options?: GetOptions): Promise<World[]> {
    const worlds = await this.client
      .select()
      .from(worldsTable)

    const results: World[] = []

    for (const world of worlds) {
      const builder = new WorldBuilder()
      builder.withName(world.name).startingMonth(world.month)
      if (options?.populate.resources) {
        const worldResources = await this.client.select().from(worldsResourcesTable).where(eq(worldsResourcesTable.worldId, world.id)).groupBy(worldsResourcesTable.worldId, worldsResourcesTable.resourceType)

        builder.addResource(...worldResources.map(({ quantity, resourceType }) => new Resource(resourceType, quantity)))
      }
      results.push(builder.build())
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
          quantity: resource.getQuantity()
        }).where(and(
          eq(worldsResourcesTable.worldId, dbEntity.id),
          eq(worldsResourcesTable.resourceType, resource.getType()),
        ))
      }
      await this.client.update(worldsTable).set({
        month
      }).where(eq(worldsTable.id, dbEntity.id))
    }
  }
}