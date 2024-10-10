import { OccupationTypes } from './enum'
import { UpgradedWork } from './interface'


const MINIMAL_AGE_TO_UPGRADE = 21

export class CharcoalBurner implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= MINIMAL_AGE_TO_UPGRADE
  }

  private RETIREMENT_AGE = 60

  get occupationType(): OccupationTypes {
    return OccupationTypes.CHARCOAL_BURNER
  }

  canRetire(personAge: number): boolean {
    return personAge > this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge >= 12 && personAge < 50
  }
}
