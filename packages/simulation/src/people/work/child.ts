import { Civilization } from '../../civilization'
import { ResourceTypes } from '../../resource'
import { getRandomInt } from '../../utils/random'
import { World } from '../../world'
import { MINIMAL_AGE_TO_WORK } from '../people'
import { OccupationTypes } from './enum'
import { Work } from './interface'

export class Child implements Work {
  canUpgrade(personAge: number): boolean {
    return personAge >= 12
  }

  collectedResource = 0

  get occupationType(): OccupationTypes {
    return OccupationTypes.CHILD
  }

  canRetire(_personAge: number): boolean {
    return false
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

  canWork(personAge: number): boolean {
    return personAge > MINIMAL_AGE_TO_WORK
  }
}
