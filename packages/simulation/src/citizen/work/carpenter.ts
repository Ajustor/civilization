import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export class Carpenter implements Work {

  get occupationType() {
    return OccupationTypes.CARPENTER
  }


  canWork(citizenAge: number): boolean {
    return citizenAge >= 12 && citizenAge < 60
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