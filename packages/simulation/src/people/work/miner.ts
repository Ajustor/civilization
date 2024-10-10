import { OccupationTypes } from './enum'
import { UpgradedWork } from './interface'

const MINIMAL_AGE_TO_UPGRADE = 25

export class Miner implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }

  public RETIREMENT_AGE = 50
  get occupationType(): OccupationTypes {
    return OccupationTypes.MINER
  }
  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
