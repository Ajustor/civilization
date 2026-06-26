import { test, expect } from 'bun:test'
import { computeRecap } from './recap'
import { ResourceTypes, BuildingTypes, Events } from '@ajustor/simulation'

const snap = (month: number, men: number, women: number, resources: any[] = [], buildings?: any[], event: any = null) => ({
  month,
  people: { men, women, pregnantWomen: 0 },
  resources,
  buildings,
  event,
})

test('pas de récap si aucun mois écoulé', () => {
  const r = computeRecap({ fromMonth: 10, toMonth: 10, baseline: snap(10, 5, 5), current: snap(10, 5, 5), periodSnapshots: [], combats: [] })
  expect(r.hasRecap).toBe(false)
})

test('population: net et pic', () => {
  const r = computeRecap({
    fromMonth: 10,
    toMonth: 13,
    baseline: snap(10, 10, 10),
    current: snap(13, 12, 13),
    periodSnapshots: [snap(11, 15, 15), snap(12, 11, 12), snap(13, 12, 13)],
    combats: [],
  })
  expect(r.hasRecap).toBe(true)
  expect(r.monthsPassed).toBe(3)
  expect(r.population.before).toBe(20)
  expect(r.population.after).toBe(25)
  expect(r.population.net).toBe(5)
  expect(r.population.peak).toBe(30)
})

test('ressources: delta par ressource', () => {
  const r = computeRecap({
    fromMonth: 1, toMonth: 2,
    baseline: snap(1, 1, 1, [{ resourceType: ResourceTypes.WOOD, quantity: 100 }]),
    current: snap(2, 1, 1, [{ resourceType: ResourceTypes.WOOD, quantity: 150 }]),
    periodSnapshots: [], combats: [],
  })
  expect(r.resources).toEqual([{ resourceType: ResourceTypes.WOOD, before: 100, after: 150, delta: 50 }])
})

test('bâtiments: delta si suivi présent', () => {
  const r = computeRecap({
    fromMonth: 1, toMonth: 2,
    baseline: snap(1, 1, 1, [], [{ buildingType: BuildingTypes.HOUSE, count: 2 }]),
    current: snap(2, 1, 1, [], [{ buildingType: BuildingTypes.HOUSE, count: 5 }, { buildingType: BuildingTypes.FARM, count: 1 }]),
    periodSnapshots: [], combats: [],
  })
  expect(r.buildingsTracked).toBe(true)
  expect(r.buildings).toEqual([
    { buildingType: BuildingTypes.HOUSE, count: 3 },
    { buildingType: BuildingTypes.FARM, count: 1 },
  ])
})

test('bâtiments: ignorés si la référence est antérieure au suivi', () => {
  const r = computeRecap({
    fromMonth: 1, toMonth: 2,
    baseline: snap(1, 1, 1, [], undefined),
    current: snap(2, 1, 1, [], [{ buildingType: BuildingTypes.HOUSE, count: 5 }]),
    periodSnapshots: [], combats: [],
  })
  expect(r.buildingsTracked).toBe(false)
  expect(r.buildings).toEqual([])
})

test('événements de la période', () => {
  const r = computeRecap({
    fromMonth: 1, toMonth: 3,
    baseline: snap(1, 1, 1), current: snap(3, 1, 1),
    periodSnapshots: [snap(2, 1, 1, [], undefined, Events.FIRE), snap(3, 1, 1)],
    combats: [],
  })
  expect(r.events).toEqual([{ month: 2, event: Events.FIRE }])
})

test('combats: agrégation victoires/butin/captifs', () => {
  const r = computeRecap({
    fromMonth: 1, toMonth: 5,
    baseline: snap(1, 1, 1), current: snap(5, 1, 1), periodSnapshots: [],
    combats: [
      { month: 2, role: 'attacker', opponentName: 'A', attackerWins: true, plunderedResources: [{ amount: 30 }, { amount: 10 }], captivesTaken: 4 },
      { month: 3, role: 'defender', opponentName: 'B', attackerWins: true, plunderedResources: [], captivesTaken: 0 },
    ],
  })
  expect(r.combats.total).toBe(2)
  expect(r.combats.wins).toBe(1)
  expect(r.combats.losses).toBe(1)
  expect(r.combats.plunder).toBe(40)
  expect(r.combats.captives).toBe(4)
  expect(r.combats.recent[0].month).toBe(3)
})
