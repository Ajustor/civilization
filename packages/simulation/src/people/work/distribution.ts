import { BuildingTypes } from '../../buildings/enum'
import { OccupationTypes } from './enum'

/**
 * The occupations whose headcount is steered by the civilization's configurable
 * distribution gauges. Soldiers are excluded (governed by MILITARY_RATIO), as are
 * children and the retired (age-driven).
 */
export const DISTRIBUTABLE_OCCUPATIONS: OccupationTypes[] = [
  OccupationTypes.GATHERER,
  OccupationTypes.WOODCUTTER,
  OccupationTypes.FARMER,
  OccupationTypes.MINER,
  OccupationTypes.KITCHEN_ASSISTANT,
  OccupationTypes.ERUDIT,
  OccupationTypes.CARPENTER,
  OccupationTypes.CHARCOAL_BURNER,
  OccupationTypes.BUILDER,
]

/**
 * Balanced-by-default target split (integer percentages summing to 100). Prioritises
 * food (gatherer + farmer + kitchen assistant) and the wood chain (woodcutter +
 * carpenter + charcoal burner) so a fresh civilization stays viable. Builders get
 * 10 % : seuls habilités à bâtir, sans eux plus aucun chantier ne démarre.
 */
export const DEFAULT_OCCUPATION_DISTRIBUTION: Partial<Record<OccupationTypes, number>> = {
  [OccupationTypes.GATHERER]: 20,
  [OccupationTypes.FARMER]: 18,
  [OccupationTypes.WOODCUTTER]: 12,
  [OccupationTypes.BUILDER]: 10,
  [OccupationTypes.CARPENTER]: 10,
  [OccupationTypes.ERUDIT]: 9,
  [OccupationTypes.KITCHEN_ASSISTANT]: 7,
  [OccupationTypes.MINER]: 7,
  [OccupationTypes.CHARCOAL_BURNER]: 7,
}

/**
 * Métiers qui exigent physiquement leur bâtiment pour exercer : le mineur (le
 * gisement EST la mine), et les métiers de transformation — commis de cuisine,
 * charpentier, charbonnier — qui ont besoin de leur installation. Leur effectif
 * reste plafonné par les places bâties et leur jauge est inactive tant que le
 * bâtiment n'est pas débloqué. À l'inverse, le fermier et l'érudit produisent
 * sans bâtiment, à rendement dégradé (voir production.ts) — leur bâtiment ne
 * sert que de boost.
 */
export const BUILDING_REQUIRED_OCCUPATIONS: OccupationTypes[] = [
  OccupationTypes.MINER,
  OccupationTypes.KITCHEN_ASSISTANT,
  OccupationTypes.CARPENTER,
  OccupationTypes.CHARCOAL_BURNER,
]

/**
 * Building each specialised occupation staffs. Base jobs (gatherer, woodcutter)
 * need no building and are therefore absent. Used to (a) know whether a target is
 * reachable given the researched tech and (b) drive construction toward boosting
 * the occupation's workers.
 */
export const OCCUPATION_BUILDING: Partial<Record<OccupationTypes, BuildingTypes>> = {
  [OccupationTypes.FARMER]: BuildingTypes.FARM,
  [OccupationTypes.MINER]: BuildingTypes.MINE,
  [OccupationTypes.ERUDIT]: BuildingTypes.LIBRARY,
  [OccupationTypes.KITCHEN_ASSISTANT]: BuildingTypes.CAMPFIRE,
  [OccupationTypes.CARPENTER]: BuildingTypes.SAWMILL,
  [OccupationTypes.CHARCOAL_BURNER]: BuildingTypes.KILN,
}

/**
 * Worker slots each building of the mapped type offers to its occupation
 * (`workerTypeRequired.count`). Kept as a constant to avoid instantiating buildings
 * on the monthly tick; `distribution.spec.ts` asserts it stays in sync with the
 * building definitions so it can never silently drift.
 */
export const OCCUPATION_BUILDING_SLOTS: Partial<Record<OccupationTypes, number>> = {
  [OccupationTypes.FARMER]: 5,
  [OccupationTypes.MINER]: 10,
  [OccupationTypes.ERUDIT]: 2,
  [OccupationTypes.KITCHEN_ASSISTANT]: 1,
  [OccupationTypes.CARPENTER]: 2,
  [OccupationTypes.CHARCOAL_BURNER]: 2,
}

/**
 * Turn the configured percentage split into concrete target headcounts for the
 * given civilian workforce.
 *
 * Only `activeOccupations` (base jobs + occupations whose building is unlocked)
 * take part: any inactive occupation is dropped and its share renormalised across
 * the rest, so a civilization never targets workers it cannot employ yet.
 * Rounding uses the largest-remainder method so the headcounts sum exactly to the
 * workforce.
 */
export function resolveTargetHeadcounts(params: {
  distribution: Partial<Record<OccupationTypes, number>>
  workforce: number
  activeOccupations: OccupationTypes[]
}): Map<OccupationTypes, number> {
  const { distribution, workforce, activeOccupations } = params
  const result = new Map<OccupationTypes, number>()

  const weights = activeOccupations
    .filter((occ) => DISTRIBUTABLE_OCCUPATIONS.includes(occ))
    .map((occ) => ({ occ, weight: Math.max(0, distribution[occ] ?? 0) }))
  const totalWeight = weights.reduce((sum, { weight }) => sum + weight, 0)

  if (workforce <= 0 || totalWeight <= 0) {
    return result
  }

  const exact = weights.map(({ occ, weight }) => {
    const raw = (weight / totalWeight) * workforce
    const floor = Math.floor(raw)
    return { occ, floor, remainder: raw - floor }
  })

  for (const { occ, floor } of exact) {
    result.set(occ, floor)
  }

  // Hand out the leftover units (workforce − Σfloors) to the largest fractional parts.
  const leftover = workforce - exact.reduce((sum, { floor }) => sum + floor, 0)
  const byRemainder = [...exact].sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < leftover && i < byRemainder.length; i++) {
    const { occ } = byRemainder[i]
    result.set(occ, (result.get(occ) ?? 0) + 1)
  }

  return result
}

/**
 * Validate an untrusted distribution (e.g. a raw API payload) against the invariant
 * the UI enforces: one integer 0–100 per distributable occupation, summing to 100.
 * Returns a clean object with only the known occupation keys, or `null` if the input
 * is malformed (missing key, non-integer, out of range, wrong sum, not an object).
 * Callers fall back to the current/default distribution on `null` so the persisted
 * value can never break the gauges.
 */
export function sanitizeOccupationDistribution(
  input: unknown,
): Partial<Record<OccupationTypes, number>> | null {
  if (!input || typeof input !== 'object') {
    return null
  }
  const source = input as Record<string, unknown>
  const result: Partial<Record<OccupationTypes, number>> = {}
  let sum = 0
  for (const occupation of DISTRIBUTABLE_OCCUPATIONS) {
    const value = source[occupation]
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 100
    ) {
      return null
    }
    result[occupation] = value
    sum += value
  }
  return sum === 100 ? result : null
}
