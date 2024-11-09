import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'
import { getRandomInt } from '../../utils/random'
import { Civilization } from '../../civilization'

const MINIMAL_AGE_TO_UPGRADE = 18

export class Gatherer implements Work {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }

  public RETIREMENT_AGE = 70

  collectedResource: number = 10

  get occupationType() {
    return OccupationTypes.GATHERER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }

  collectResources(world: World, civilization: Civilization): boolean {
    const possibleResourceCollected = [ResourceTypes.FOOD, ResourceTypes.STONE]
    const resource = world.getResource(
      possibleResourceCollected[
      getRandomInt(0, possibleResourceCollected.length - 1)
      ],
    )
    if (resource) {
      if (resource.quantity >= this.collectedResource) {
        resource.decrease(this.collectedResource)
        civilization.increaseResource(resource.type, this.collectedResource)
        return true
      }
    }
    return false
  }
}
