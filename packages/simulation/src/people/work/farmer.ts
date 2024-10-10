import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'

export const FARMER_REQUIRED_AGE = 21

export class Farmer implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge > FARMER_REQUIRED_AGE
  }

  public RETIREMENT_AGE = 70

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
