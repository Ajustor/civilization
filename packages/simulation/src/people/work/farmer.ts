import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export class Farmer implements Work {

  get occupationType() {
    return OccupationTypes.FARMER
  }

  canWork(personAge: number): boolean {
    return personAge > 4 && personAge < 70
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