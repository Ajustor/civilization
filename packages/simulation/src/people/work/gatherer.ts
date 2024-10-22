import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'
import { random } from '../../utils/random'

export class Gatherer implements Work {

  public RETIREMENT_AGE = 70

  get occupationType() {
    return OccupationTypes.GATHERER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge > 4 && personAge < this.RETIREMENT_AGE
  }

  collectResources(world: World, count: number): boolean {
    const possibleResourceCollected = [ResourceTypes.FOOD, ResourceTypes.STONE]
    const resource = world.getResource(possibleResourceCollected[random(0, possibleResourceCollected.length - 1)])
    if (resource) {
      if (resource.quantity >= count) {
        resource.decrease(count)
        return true
      }
    }
    return false
  }
}