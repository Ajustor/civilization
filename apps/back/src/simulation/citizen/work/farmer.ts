import { ResourceType } from '../../resource'
import type { World } from '../../world'
import { ProfessionType } from './enum'
import type { Work } from './interface'

export class Farmer implements Work {

  get professionType() {
    return ProfessionType.FARMER
  }

  canWork(citizenAge: number): boolean {
    return citizenAge > 4 && citizenAge < 70
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceType.FOOD)
    if (resource) {
      if (resource.quantity >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}