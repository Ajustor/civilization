import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export const FARMER_REQUIRED_AGE = 4

export class Farmer implements Work {

  public RETIREMENT_AGE = 70

  get occupationType() {
    return OccupationTypes.FARMER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge >= FARMER_REQUIRED_AGE && personAge < this.RETIREMENT_AGE
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceTypes.FOOD)
    if (resource) {
      if (resource.quantity >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}