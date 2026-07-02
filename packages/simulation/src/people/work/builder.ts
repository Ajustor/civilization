import { OccupationTypes } from './enum'
import type { UpgradedWork } from './interface'
import { RETIREMENT_AGE_BY_OCCUPATION } from './ages'

export const BUILDER_REQUIRED_AGE = 16

// Seul métier autorisé à bâtir : chaque chantier mobilise des constructeurs
// (workerRequiredToBuild). Un constructeur sans chantier ne produit rien —
// la part de la jauge qui lui est allouée est un vrai arbitrage.
export class Builder implements UpgradedWork {
  canUpgrade(personAge: number): boolean {
    return personAge >= BUILDER_REQUIRED_AGE
  }

  public RETIREMENT_AGE = RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.BUILDER]

  get occupationType() {
    return OccupationTypes.BUILDER
  }

  canRetire(personAge: number): boolean {
    return personAge >= this.RETIREMENT_AGE
  }

  canWork(personAge: number): boolean {
    return personAge < this.RETIREMENT_AGE
  }
}
