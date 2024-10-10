import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { Work } from './interface'
import type { World } from '../../world'
import { Civilization } from '../../civilization'

const MINIMAL_AGE_TO_UPGRADE = 18

export class WoodCutter implements Work {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }
  collectedResource = 10
  private RETIREMENT_AGE = 60

  get occupationType() {
    return OccupationTypes.WOODCUTTER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }

  collectResources(world: World, civilization: Civilization): boolean {
    const resource = world.getResource(ResourceTypes.WOOD)
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
