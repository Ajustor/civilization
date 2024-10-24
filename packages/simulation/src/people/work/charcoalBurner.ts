import { Civilization, Resource, ResourceTypes } from '../..'
import { OccupationTypes } from './enum'
import { UpgradedWork } from './interface'

const RESOURCES_PRODUCED = 2

export class CharcoalBurner implements UpgradedWork {
  private RETIREMENT_AGE = 60

  get occupationType(): OccupationTypes {
    return OccupationTypes.CHARCOAL_BURNER
  }

  canRetire(personAge: number): boolean {
    return personAge > this.RETIREMENT_AGE
  }

  produceResources(civilization: Civilization): boolean {
    const resource = civilization.getResource(ResourceTypes.WOOD)
    if (resource?.quantity) {
      resource.decrease(1)
      const charcoal = civilization.getResource(ResourceTypes.CHARCOAL) ?? new Resource(ResourceTypes.CHARCOAL, 0)
      charcoal.increase(RESOURCES_PRODUCED)
      civilization.addResource(charcoal)
      return true
    }
    return false
  }

  canWork(personAge: number): boolean {
    return personAge >= 12 && personAge < 50
  }

}