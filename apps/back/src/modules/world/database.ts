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

  async getAll(): Promise<World[]> {
    const worlds = await this.client
      .select()
      .from(worldsTable)

    const results: World[] = []

    for (const world of worlds) {
      const builder = new WorldBuilder()
      builder.withName(world.name).withId(world.id).startingMonth(world.month)

      const worldResources = await this.client.select().from(worldsResourcesTable).where(eq(worldsResourcesTable.worldId, world.id)).groupBy(worldsResourcesTable.worldId, worldsResourcesTable.resourceType)
      builder.addResource(...worldResources.map(({ quantity, resourceType }) => new Resource(resourceType, quantity)))

      results.push(builder.build())
    }

    return results
  }

  async saveAll(worlds: World[]) {
    for (const world of worlds) {
      const { month, resources } = world.getInfos()

      for (const resource of resources) {
        await this.client.update(worldsResourcesTable).set({
          quantity: resource.quantity
        }).where(and(
          eq(worldsResourcesTable.worldId, world.id),
          eq(worldsResourcesTable.resourceType, resource.type),
        ))
      }

      console.log('Saving world to database')
      await this.client.update(worldsTable).set({
        month
      }).where(eq(worldsTable.id, world.id))
    }
  }
}