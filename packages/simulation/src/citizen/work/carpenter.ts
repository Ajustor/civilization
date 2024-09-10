import { ResourceTypes } from '../../resource'
import type { World } from '../../world'
import { ProfessionTypes } from './enum'
import type { Work } from './interface'

export class Carpenter implements Work {

  get professionType() {
    return ProfessionTypes.CARPENTER
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