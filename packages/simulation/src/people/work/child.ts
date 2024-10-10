import { Civilization } from '../../civilization'
import { World } from '../../world'
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

  collectResources(_world: World, _civilization: Civilization): boolean {
    return false
  }

  canWork(_personAge: number): boolean {
    return false
  }
}
