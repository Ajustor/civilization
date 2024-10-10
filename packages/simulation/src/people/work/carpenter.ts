import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { UpgradedWork } from './interface'
import { Civilization, Resource } from '../..'

const RESOURCES_PRODUCED = 5

export class Carpenter implements UpgradedWork {

  public RETIREMENT_AGE = 60

  get occupationType() {
    return OccupationTypes.CARPENTER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge >= 12 && personAge < this.RETIREMENT_AGE
  }

  produceResources(civilization: Civilization): boolean {
    const resource = civilization.getResource(ResourceTypes.WOOD)
    if (resource?.quantity) {
      resource.decrease(1)
      const plank = civilization.getResource(ResourceTypes.PLANK) ?? new Resource(ResourceTypes.PLANK, 0)
      plank.increase(RESOURCES_PRODUCED)
      civilization.addResource(plank)
      return true
    }
    return false
  }
}