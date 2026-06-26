import type { BuildingTypes, Events, ResourceTypes } from '@ajustor/simulation'

export type RecapStatsSnapshot = {
  month: number
  people?: { men: number; women: number; pregnantWomen: number } | null
  resources: { resourceType: ResourceTypes; quantity: number }[]
  buildings?: { buildingType: BuildingTypes; count: number }[]
  event?: Events | null
}

export type RecapCombatLog = {
  month: number
  role: 'attacker' | 'defender'
  opponentName: string
  attackerWins: boolean
  plunderedResources: { amount: number }[]
  captivesTaken: number
}

export type RecapData = {
  hasRecap: boolean
  monthsPassed: number
  population: { before: number; after: number; net: number; peak: number }
  resources: { resourceType: ResourceTypes; before: number; after: number; delta: number }[]
  buildings: { buildingType: BuildingTypes; count: number }[]
  buildingsTracked: boolean
  events: { month: number; event: Events }[]
  combats: {
    total: number
    wins: number
    losses: number
    plunder: number
    captives: number
    recent: { month: number; opponentName: string; won: boolean }[]
  }
}

export type ComputeRecapInput = {
  fromMonth: number
  toMonth: number
  baseline: RecapStatsSnapshot | null
  current: RecapStatsSnapshot | null
  periodSnapshots: RecapStatsSnapshot[]
  combats: RecapCombatLog[]
}

export const emptyRecap = (): RecapData => ({
  hasRecap: false,
  monthsPassed: 0,
  population: { before: 0, after: 0, net: 0, peak: 0 },
  resources: [],
  buildings: [],
  buildingsTracked: false,
  events: [],
  combats: { total: 0, wins: 0, losses: 0, plunder: 0, captives: 0, recent: [] },
})

const totalPop = (snapshot?: RecapStatsSnapshot | null): number =>
  snapshot?.people ? snapshot.people.men + snapshot.people.women : 0

export function computeRecap(input: ComputeRecapInput): RecapData {
  const { fromMonth, toMonth, baseline, current, periodSnapshots, combats } = input

  if (toMonth <= fromMonth || !current) {
    return emptyRecap()
  }

  const before = totalPop(baseline)
  const after = totalPop(current)
  const peak = Math.max(after, before, ...periodSnapshots.map(totalPop))

  const baselineResources = new Map(
    (baseline?.resources ?? []).map((resource) => [resource.resourceType, resource.quantity]),
  )
  const resources = current.resources.map((resource) => {
    const beforeQty = baselineResources.get(resource.resourceType) ?? 0
    return {
      resourceType: resource.resourceType,
      before: beforeQty,
      after: resource.quantity,
      delta: resource.quantity - beforeQty,
    }
  })

  const buildingsTracked =
    Array.isArray(baseline?.buildings) && Array.isArray(current.buildings)
  let buildings: RecapData['buildings'] = []
  if (buildingsTracked) {
    const baselineBuildings = new Map(
      (baseline?.buildings ?? []).map((building) => [building.buildingType, building.count]),
    )
    buildings = (current.buildings ?? [])
      .map((building) => ({
        buildingType: building.buildingType,
        count: building.count - (baselineBuildings.get(building.buildingType) ?? 0),
      }))
      .filter((building) => building.count > 0)
  }

  const events = periodSnapshots
    .filter((snapshot) => snapshot.event)
    .map((snapshot) => ({ month: snapshot.month, event: snapshot.event as Events }))

  const enriched = combats.map((combat) => ({
    ...combat,
    won: combat.role === 'attacker' ? combat.attackerWins : !combat.attackerWins,
  }))
  const wins = enriched.filter((combat) => combat.won).length
  const wonAttacks = enriched.filter((combat) => combat.role === 'attacker' && combat.attackerWins)
  const plunder = wonAttacks.reduce(
    (sum, combat) => sum + combat.plunderedResources.reduce((acc, resource) => acc + resource.amount, 0),
    0,
  )
  const captives = wonAttacks.reduce((sum, combat) => sum + combat.captivesTaken, 0)
  const recent = [...enriched]
    .sort((a, b) => b.month - a.month)
    .slice(0, 5)
    .map((combat) => ({ month: combat.month, opponentName: combat.opponentName, won: combat.won }))

  return {
    hasRecap: true,
    monthsPassed: toMonth - fromMonth,
    population: { before, after, net: after - before, peak },
    resources,
    buildings,
    buildingsTracked,
    events,
    combats: { total: combats.length, wins, losses: combats.length - wins, plunder, captives, recent },
  }
}
