import { World, WorldBuilder, Resource, ResourceTypes, Events, type WorldConfig } from '@ajustor/simulation'
import { WorldModel } from '../../libs/database/models'

// Mongoose subdocuments don't spread reliably, so read each config field explicitly.
// Returns undefined when no config is stored (older worlds) so the builder falls back
// to the simulation defaults.
const extractWorldConfig = (config?: Partial<WorldConfig> | null): Partial<WorldConfig> | undefined => {
  if (!config) {
    return undefined
  }
  return {
    BASE_FOOD_GENERATION: config.BASE_FOOD_GENERATION,
    BASE_WOOD_GENERATION: config.BASE_WOOD_GENERATION,
    EVENT_CHANCE: config.EVENT_CHANCE,
  }
}

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
    builder.withName(world.name).withId(world.id).startingMonth(world.month).withConfig(extractWorldConfig(world.config))

    builder.addResource(...world.resources.map(({ quantity, resourceType }) => new Resource(resourceType as ResourceTypes, quantity ?? 0)))


    return builder.build()
  }

  async getAll(): Promise<World[]> {
    const worlds = await WorldModel.find()

    const results: World[] = []

    for (const world of worlds) {
      const builder = new WorldBuilder()
      builder.withName(world.name).withId(world.id).startingMonth(world.month).withNextEvent(world.nextEvent as Events).withConfig(extractWorldConfig(world.config))

      builder.addResource(...world.resources.map(({ quantity, resourceType }) => new Resource(resourceType as ResourceTypes, quantity ?? 0)))

      results.push(builder.build())
    }

    return results
  }

  async saveAll(worlds: World[]) {
    for (const world of worlds) {

      console.time('worldSave')
      await WorldModel.updateOne({ _id: world.id }, { month: world.getMonth(), nextEvent: world.nextEvent, config: world.getConfig(), resources: world.getResources().map(({ type, quantity }) => ({ resourceType: type, quantity })) })
      console.timeEnd('worldSave')
    }
  }
}