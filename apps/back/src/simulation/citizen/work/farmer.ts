import { OccupationType } from './enum'
import { ResourceType } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export class Farmer implements Work {

  get occupationType() {
    return OccupationType.FARMER
  }

  canWork(citizenAge: number): boolean {
    return citizenAge > 4 && citizenAge < 70
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceType.FOOD)
    if (resource) {
      if (resource.getQuantity() >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}