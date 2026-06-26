import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'

export const SOLDIER_REQUIRED_AGE = 18

export class Soldier implements UpgradedWork {
  public RETIREMENT_AGE = 60

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
