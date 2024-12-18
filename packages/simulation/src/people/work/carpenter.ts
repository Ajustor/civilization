import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'

const MINIMAL_AGE_TO_UPGRADE = 21

export class Carpenter implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }

  public RETIREMENT_AGE = 60

  get occupationType() {
    return OccupationTypes.CARPENTER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
