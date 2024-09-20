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

      console.log('Saving world to database')
      await WorldModel.updateOne({ _id: world.id }, { month: month + (year * 12), resources: resources.map(({ type, quantity }) => ({ resourceType: type, quantity })) })
    }
  }
}