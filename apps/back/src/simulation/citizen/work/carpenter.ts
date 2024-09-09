import { OccupationType } from './enum'
import { ResourceType } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'

export class Carpenter implements Work {

  get occupationType() {
    return OccupationType.CARPENTER
  }


  canWork(citizenAge: number): boolean {
    return citizenAge >= 12 && citizenAge < 60
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceType.WOOD)
    if (resource) {
      if (resource.getQuantity() >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}