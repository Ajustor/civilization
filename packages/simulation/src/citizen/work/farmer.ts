import { ResourceTypes } from '../../resource'
import type { World } from '../../world'
import { ProfessionTypes } from './enum'
import type { Work } from './interface'

export class Farmer implements Work {

  get professionType() {
    return ProfessionTypes.FARMER
  }

  canWork(citizenAge: number): boolean {
    return citizenAge > 4 && citizenAge < 70
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