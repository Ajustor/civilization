import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export class WoodCutter implements Work {

  private RETIREMENT_AGE = 60

  get occupationType() {
    return OccupationTypes.WOOD_CUTTER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge >= 12 && personAge < 60
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceTypes.WOOD)
    if (resource) {
      if (resource.quantity >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}