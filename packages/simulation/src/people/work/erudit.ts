import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'

export const ERUDIT_REQUIRED_AGE = 21

export class Erudit implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= ERUDIT_REQUIRED_AGE
  }

  public RETIREMENT_AGE = 70

  get occupationType() {
    return OccupationTypes.ERUDIT
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
