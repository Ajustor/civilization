import { World, WorldBuilder, Resource, ResourceTypes } from '@ajustor/simulation'
import { WorldModel } from '../../libs/database/models'

export type GetOptions = {
  populate: {
    resources: boolean
  }
}

export class WorldsTable {
  constructor() {

  }

  async getById(worldId: string): Promise<World> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      throw new Error('No world found for that id')
    }

    const builder = new WorldBuilder()
    builder.withName(world.name).withId(world.id).startingMonth(world.month)

    builder.addResource(...world.resources.map(({ quantity, resourceType }) => new Resource(resourceType as ResourceTypes, quantity ?? 0)))


    return builder.build()
  }

  async getAll(): Promise<World[]> {
    const worlds = await WorldModel.find()

    const results: World[] = []

    for (const world of worlds) {
      const builder = new WorldBuilder()
      builder.withName(world.name).withId(world.id).startingMonth(world.month)

      builder.addResource(...world.resources.map(({ quantity, resourceType }) => new Resource(resourceType as ResourceTypes, quantity ?? 0)))

      results.push(builder.build())
    }

    return results
  }

  async saveAll(worlds: World[]) {
    for (const world of worlds) {
      const { month, resources, year } = world.getInfos()

      console.time('worldSave')
      await WorldModel.updateOne({ _id: world.id }, { month: month + (year * 12), resources: resources.map(({ type, quantity }) => ({ resourceType: type, quantity })) })
      console.timeEnd('worldSave')
    }
  }
}