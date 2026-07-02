import { OccupationTypes } from './enum'

// Minimum age required to take up each occupation, centralised here from the
// per-job *_REQUIRED_AGE / MINIMAL_AGE_TO_UPGRADE constants. This is the single
// source of truth the upgrade logic uses to enforce a *target* job's entry age.
//
// Previously only the source job's age was checked, so the entry-age constants
// (e.g. a miner's required age of 25, a farmer's of 21) were never applied: an
// 18-year-old gatherer could immediately become a miner. The values below match
// the constants already declared in each work class.
export const MINIMAL_AGE_TO_BECOME: Record<OccupationTypes, number> = {
  [OccupationTypes.CHILD]: 0,
  [OccupationTypes.RETIRED]: 0,
  // Children specialise into gathering/woodcutting from 12 (Child.canUpgrade).
  [OccupationTypes.GATHERER]: 12,
  [OccupationTypes.WOODCUTTER]: 12,
  // Specialised trades, from their declared required ages.
  [OccupationTypes.FARMER]: 21,
  [OccupationTypes.MINER]: 25,
  [OccupationTypes.CARPENTER]: 21,
  [OccupationTypes.CHARCOAL_BURNER]: 21,
  [OccupationTypes.KITCHEN_ASSISTANT]: 21,
  [OccupationTypes.ERUDIT]: 21,
  [OccupationTypes.SOLDIER]: 18,
  [OccupationTypes.BUILDER]: 16,
}

// Âge de retraite par métier. Centralise les constantes RETIREMENT_AGE jusque-là
// dupliquées dans chaque classe de travail (single source of truth, comme
// MINIMAL_AGE_TO_BECOME). 0 = sans objet (Enfant / Retraité).
export const RETIREMENT_AGE_BY_OCCUPATION: Record<OccupationTypes, number> = {
  [OccupationTypes.CHILD]: 0,
  [OccupationTypes.RETIRED]: 0,
  [OccupationTypes.GATHERER]: 70,
  [OccupationTypes.WOODCUTTER]: 60,
  [OccupationTypes.FARMER]: 70,
  [OccupationTypes.MINER]: 50,
  [OccupationTypes.CARPENTER]: 60,
  [OccupationTypes.CHARCOAL_BURNER]: 60,
  [OccupationTypes.KITCHEN_ASSISTANT]: 70,
  [OccupationTypes.ERUDIT]: 80,
  [OccupationTypes.SOLDIER]: 60,
  [OccupationTypes.BUILDER]: 60,
}
