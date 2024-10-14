import { OccupationTypes } from './enum'
import type { Work } from './interface'
import type { World } from '../../world'

export class Retired implements Work {

  get occupationType() {
    return OccupationTypes.RETIRED
  }

  canRetire(_personAge: number): boolean {
    return false
  }

  canWork(_personAge: number): boolean {
    return false
  }

  collectResources(_world: World, _count: number): boolean {
    return false
  }
}