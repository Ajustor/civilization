import { Events } from './enum'

// Force de la pénalité anti-répétition. À 1, la 2e occurrence consécutive d'un
// même événement divise son poids par 2, la 3e par 3, etc. (style des constantes
// de tuning de world.ts comme PLUNDER_RATIO).
export const EVENT_REPEAT_PENALTY = 1

export type EventWeight = { event: Events | null; weight: number }

// Poids de base de chaque issue mensuelle (le tirage n'a lieu qu'APRÈS la porte
// EVENT_CHANCE). Total = 100 pour une lecture directe en %. `null` = mois calme.
export const BASE_EVENT_WEIGHTS: ReadonlyArray<EventWeight> = [
  { event: Events.EARTHQUAKE, weight: 10 },
  { event: Events.STARVATION, weight: 10 },
  { event: Events.MIGRATION, weight: 15 },
  { event: Events.FIRE, weight: 12 },
  { event: Events.RAT_INVASION, weight: 12 },
  { event: Events.BOUNTIFUL_HARVEST, weight: 14 },
  { event: Events.TRADE_CARAVAN, weight: 11 },
  { event: Events.FORTUNATE_DISCOVERY, weight: 6 },
  { event: Events.GOLDEN_AGE, weight: 5 },
  { event: null, weight: 5 },
]

// Applique la pénalité dégressive à l'événement qui vient de se répéter. Le bucket
// « mois calme » (null) n'est jamais pénalisé.
export function buildEventWeights(
  lastEvent: Events | null,
  eventStreak: number,
): EventWeight[] {
  return BASE_EVENT_WEIGHTS.map(({ event, weight }) =>
    event !== null && event === lastEvent && eventStreak > 0
      ? { event, weight: weight / (1 + eventStreak * EVENT_REPEAT_PENALTY) }
      : { event, weight },
  )
}

// Tirage pondéré déterministe : `random` ∈ [0,1) est mis à l'échelle sur le total
// (renormalisation implicite quand une pénalité a réduit la somme).
export function pickWeightedEvent(
  weights: ReadonlyArray<EventWeight>,
  random: number,
): Events | null {
  const total = weights.reduce((sum, { weight }) => sum + weight, 0)
  if (total <= 0) {
    return null
  }
  let target = random * total
  for (const { event, weight } of weights) {
    target -= weight
    if (target < 0) {
      return event
    }
  }
  return weights[weights.length - 1]?.event ?? null
}
