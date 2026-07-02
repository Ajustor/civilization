/**
 * Behaviour of the distribution-driven occupation steering & construction.
 *
 * Evolution rule (user requirement): if a job has room the gauge wants filled
 * (`current < min(target, capacity)`) and the citizen meets the prerequisites
 * (age + occupation-tree path + unlocked building), the promotion happens — no
 * probability, no random target. Construction is driven by `target > capacity`,
 * independently of the current worker count (this is what breaks the old
 * "stuck at 1 building" deadlock).
 */

import { Civilization } from './civilization'
import { BuildingTypes } from './buildings/enum'
import { Farm } from './buildings/farm'
import { Library } from './buildings/library'
import { Mine } from './buildings/mine'
import { People } from './people/people'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'
import { TechId } from './technology/techTree'
import { World } from './world'

type Dist = Partial<Record<OccupationTypes, number>>

function makeCiv(distribution: Dist): Civilization {
  const civ = new Civilization('Steer')
  civ.config = { ...civ.config, OCCUPATION_DISTRIBUTION: distribution }
  return civ
}

function addGatherers(civ: Civilization, count: number, years = 30): void {
  for (let i = 0; i < count; i++) {
    const p = new People({ month: 12 * years, gender: Gender.MALE, lifeCounter: 10 })
    p.id = `g-${i}-${years}`
    p.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(p)
  }
}

const countOf = (civ: Civilization, occ: OccupationTypes) =>
  civ.getPeopleWithOccupation(occ).length

// ── Évolution ────────────────────────────────────────────────────────────────

describe('adaptPeopleJob: deterministic slot filling', () => {
  it('fills a free building slot the gauge wants, in a single tick', () => {
    // 1 farm = 5 farmer slots; gauge wants 50% farmers of a 20-strong workforce (=10),
    // capped by capacity 5 → all 5 farm slots filled deterministically.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(1))
    addGatherers(civ, 20)

    civ.adaptPeopleJob()

    expect(countOf(civ, OccupationTypes.FARMER)).toBe(5)
  })

  it('caps promotions at the gauge target when it is below capacity', () => {
    // Gauge wants only 10% farmers (=2 of 20), even though the farm has 5 slots.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 90, [OccupationTypes.FARMER]: 10 })
    civ.addBuilding(new Farm(1))
    addGatherers(civ, 20)

    civ.adaptPeopleJob()

    expect(countOf(civ, OccupationTypes.FARMER)).toBe(2)
  })

  it('does not promote without a building slot (no farm → no farmers)', () => {
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    addGatherers(civ, 20)

    civ.adaptPeopleJob()

    expect(countOf(civ, OccupationTypes.FARMER)).toBe(0)
  })

  it('respects prerequisites: too-young citizens do not evolve', () => {
    // Farmer entry age is 21; 19-year-olds cannot take the free farm slots.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(1))
    addGatherers(civ, 10, 19)

    civ.adaptPeopleJob()

    expect(countOf(civ, OccupationTypes.FARMER)).toBe(0)
  })

  it('lets the gauge prioritise which open slot to fill', () => {
    // Both a farm and a library have room, but the gauge wants only farmers.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 0, [OccupationTypes.FARMER]: 100 })
    civ.addBuilding(new Farm(1))
    civ.addBuilding(new Library(1))
    addGatherers(civ, 1)

    civ.adaptPeopleJob()

    expect(countOf(civ, OccupationTypes.FARMER)).toBe(1)
    expect(countOf(civ, OccupationTypes.ERUDIT)).toBe(0)
  })
})

// ── Construction pilotée par la cible ────────────────────────────────────────

describe('autoBuildCandidates: target-driven construction', () => {
  it('expands when the target exceeds capacity even with NO surplus workers (the deadlock fix)', () => {
    // 1 farm (cap 5); gauge wants 15 farmers (50% of 30) → deficit 10 → build more.
    // Crucially there are 0 current farmers, so the old surplus rule gave weight 0.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(1))
    addGatherers(civ, 30)

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!

    expect(farm.weight).toBeGreaterThan(0)
  })

  it('does not expand when capacity already meets the target', () => {
    // 2 farms (cap 10); gauge wants 10 farmers (50% of 20) → deficit 0.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(2))
    addGatherers(civ, 20)

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!

    expect(farm.weight).toBe(0)
  })

  it('never weights a tech-locked building, even with demand', () => {
    // Gauge wants miners, but MINE needs MASONRY (not researched) → weight 0.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.MINER]: 50 })
    addGatherers(civ, 30)

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const mine = candidates.find((c) => c.type === BuildingTypes.MINE)

    expect(mine?.weight ?? 0).toBe(0)
  })

  it('counts pending constructions so it does not double-queue', () => {
    // Gauge wants 5 farmers (50% of 10); a pending farm already covers 5 slots.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    addGatherers(civ, 10)
    civ.pendingConstructions.push({ buildingType: BuildingTypes.FARM, monthsRemaining: 3 })

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!

    expect(farm.weight).toBe(0)
  })

  it('actually queues a MINE when unlocked and the gauge wants miners (no crash)', () => {
    // Mine has no construction resource cost; buildNew must tolerate that instead of
    // crashing on `constructionCosts.every`. With MASONRY researched and a strong miner
    // demand, a mine must get queued.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 20, [OccupationTypes.MINER]: 80 })
    civ.config = { ...civ.config, CHANCE_TO_BUILD_EVOLVED_BUILDING: 100 }
    civ.researchedTechs = [TechId.CRAFTSMANSHIP, TechId.MASONRY]
    addGatherers(civ, 40) // miner target = 80% of 40 = 32 → well above one mine's 10 slots

    civ['buildNewBuilding'](new World('test', 4))

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.MINE)).toBe(true)
  })

  it('gives the mine zero weight when one already stands (unique building)', () => {
    // Une seule mine par civilisation : même avec un gros déficit de mineurs
    // (cible 32, capacité 10), une mine debout bloque toute nouvelle mine.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 20, [OccupationTypes.MINER]: 80 })
    civ.researchedTechs = [TechId.CRAFTSMANSHIP, TechId.MASONRY]
    civ.addBuilding(new Mine(1))
    addGatherers(civ, 40)

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const mine = candidates.find((c) => c.type === BuildingTypes.MINE)!

    expect(mine.weight).toBe(0)
  })

  it('gives the mine zero weight while one is under construction', () => {
    // Un chantier de mine en cours bloque aussi : capacityGap seul laisserait un
    // déficit (32 − 10 pending = 22) et re-queuerait une deuxième mine.
    const civ = makeCiv({ [OccupationTypes.GATHERER]: 20, [OccupationTypes.MINER]: 80 })
    civ.researchedTechs = [TechId.CRAFTSMANSHIP, TechId.MASONRY]
    civ.pendingConstructions.push({ buildingType: BuildingTypes.MINE, monthsRemaining: 5 })
    addGatherers(civ, 40)

    const candidates = civ['autoBuildCandidates']() as { type: BuildingTypes; weight: number }[]
    const mine = candidates.find((c) => c.type === BuildingTypes.MINE)!

    expect(mine.weight).toBe(0)
  })
})
