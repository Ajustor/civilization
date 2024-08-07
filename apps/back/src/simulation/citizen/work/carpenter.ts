import { ResourceType } from '../../resource'
import type { World } from '../../world'
import { ProfessionType } from './enum'
import type { Work } from './interface'

export class Carpenter implements Work {

  get professionType() {
    return ProfessionType.CARPENTER
  }


  canWork(citizenAge: number): boolean {
    return citizenAge >= 12 && citizenAge < 60
  }

  collectResources(world: World, count: number): boolean {
    const resource = world.getResource(ResourceType.WOOD)
    if (resource) {
      if (resource.quantity >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}