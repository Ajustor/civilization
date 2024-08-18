import { Civilization } from '../civilization'
import { Resource } from '../resource'
import { World } from '../world'

export class WorldBuilder {
  private name: string = 'The world';
  private month: number = 1;
  private resources: Resource[] = [];
  private civilizations: Civilization[] = [];

  withName(name: string): this {
    this.name = name
    return this
  }

  startingMonth(month: number): this {
    this.month = month
    return this
  }

  addResource(...resources: Resource[]): this {
    this.resources.push(...resources)
    return this
  }

  addCivilization(...civilizations: Civilization[]): this {
    this.civilizations.push(...civilizations)
    return this
  }

  build(): World {
    const world = new World(this.name, this.month)

    // Add resources
    for (const resource of this.resources) {
      world.increaseResource(resource.getType(), resource.getQuantity())
    }

    // Add civilizations
    for (const civilization of this.civilizations) {
      world.addCivilization(civilization)
    }

    return world
  }
}