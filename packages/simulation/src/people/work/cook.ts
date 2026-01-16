import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'

export const COOK_REQUIRED_AGE = 23

export class Cook implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge > COOK_REQUIRED_AGE
  }

  public RETIREMENT_AGE = 70

  get occupationType() {
    return OccupationTypes.KITCHEN_ASSISTANT
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
