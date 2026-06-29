import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'
import { RETIREMENT_AGE_BY_OCCUPATION } from './ages'

export const FARMER_REQUIRED_AGE = 21

export class Farmer implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= FARMER_REQUIRED_AGE
  }

  public RETIREMENT_AGE = RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.FARMER]

  get occupationType() {
    return OccupationTypes.FARMER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
