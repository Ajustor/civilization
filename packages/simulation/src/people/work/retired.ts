import { OccupationTypes } from './enum'
import type { Work } from './interface'
import type { World } from '../../world'
import { Civilization } from '../../civilization'

export class Retired implements Work {
  canUpgrade(personAge: number): boolean {
    return false
  }

  collectedResource: number = 0
  get occupationType() {
    return OccupationTypes.RETIRED
  }

  canRetire(_personAge: number): boolean {
    return false
  }

  canWork(_personAge: number): boolean {
    return false
  }

  collectResources(_world: World, _civilization: Civilization): boolean {
    return false
  }
}
