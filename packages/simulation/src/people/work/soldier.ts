import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'
import { RETIREMENT_AGE_BY_OCCUPATION } from './ages'

export const SOLDIER_REQUIRED_AGE = 18

export class Soldier implements UpgradedWork {
  public RETIREMENT_AGE = RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.SOLDIER]

  canUpgrade(personAge: number): boolean {
    return personAge >= SOLDIER_REQUIRED_AGE
  }

  get occupationType() {
    return OccupationTypes.SOLDIER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
