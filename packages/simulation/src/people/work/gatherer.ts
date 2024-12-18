import { Civilization } from '../../civilization'
import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'
import { getRandomInt } from '../../utils/random'

const MINIMAL_AGE_TO_UPGRADE = 18

export class Gatherer implements Work {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }

  public RETIREMENT_AGE = 70

  collectedResource: number = 20

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
    const possibleResourceCollected = [
      ResourceTypes.RAW_FOOD,
      ResourceTypes.STONE,
    ]
    let worldResource = world.getResource(
      possibleResourceCollected[
      getRandomInt(0, possibleResourceCollected.length - 1)
      ],
    )

    if(!worldResource?.quantity) {
      worldResource = world.getResource(ResourceTypes.RAW_FOOD)
    }
    
    if (worldResource) {
      if (worldResource.quantity >= this.collectedResource) {
        worldResource.decrease(this.collectedResource)
        civilization.increaseResource(worldResource.type, this.collectedResource)
        return true
      }
    }
    return false
  }
}
