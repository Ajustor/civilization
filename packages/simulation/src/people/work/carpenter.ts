import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'
import type { UpgradedWork } from './interface'
import { Civilization, Resource } from '../..'

export class Carpenter implements UpgradedWork {

  get occupationType() {
    return OccupationTypes.CARPENTER
  }


  canWork(personAge: number): boolean {
    return personAge >= 12 && personAge < 60
  }

  produceResources(civilization: Civilization, count: number): boolean {
    const resource = civilization.getResource(ResourceTypes.WOOD)
    if (resource?.quantity) {
      resource.decrease(1)
      const plank = civilization.getResource(ResourceTypes.PLANK) ?? new Resource(ResourceTypes.PLANK, 0)
      plank.increase(5)
      civilization.addResource(plank)
      return true
    }
    return false
  }
}