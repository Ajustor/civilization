import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export const CARPENTER_REQUIRED_AGE = 12

export class Carpenter implements Work {

  public RETIREMENT_AGE = 60

  get occupationType() {
    return OccupationTypes.CARPENTER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge >= CARPENTER_REQUIRED_AGE && personAge < this.RETIREMENT_AGE
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