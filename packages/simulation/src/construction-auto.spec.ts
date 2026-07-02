/**
 * Suite for the distribution-driven auto-construction system.
 *
 * Construction is now driven by the gap between an occupation's target headcount
 * (from the civilization's OCCUPATION_DISTRIBUTION gauges applied to its civilian
 * workforce) and the staffing capacity already built + pending. A building is
 * weighted when `target > capacity`, independently of the current worker count —
 * this is what lets the civilization grow past one building of each type.
 *
 * Tests call the private `buildNewBuilding` / `autoBuildCandidates` via bracket
 * notation. Chance is forced to 100 % (CHANCE_TO_BUILD_EVOLVED_BUILDING = 100) so
 * every candidate whose weight > 0 is attempted.
 */

import { Civilization } from './civilization'
import { BuildingTypes } from './buildings/enum'
import { Cache } from './buildings/cache'
import { Farm } from './buildings/farm'
import { Library } from './buildings/library'
import { People } from './people/people'
import { Gender } from './people/enum'
import { Resource, ResourceTypes } from './resource'
import { OccupationTypes } from './people/work/enum'
import { TechId } from './technology/techTree'
import { World } from './world'

type Dist = Partial<Record<OccupationTypes, number>>
type WeightedCandidate = { type: BuildingTypes; weight: number }

// ── helpers ─────────────────────────────────────────────────────────────────

/** A world whose month is in winter (month 9 → % 12 === 9 >= 6). */
const winterWorld = () => new World('test', 9)

/** A world whose month is in summer (month 4 → % 12 === 4 < 6). */
const summerWorld = () => new World('test', 4)

/** Create a worker of the given occupation, old enough to work. */
function makeWorker(occupation: OccupationTypes, id: string): People {
  const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
  p.id = id
  p.setOccupation(occupation)
  return p
}

/** Baseline civilization with the build chance forced to 100 %. */
function makeCiv(name = 'TestCiv', distribution?: Dist): Civilization {
  const civ = new Civilization(name)
  civ.config = {
    ...civ.config,
    CHANCE_TO_BUILD_EVOLVED_BUILDING: 100,
    ...(distribution ? { OCCUPATION_DISTRIBUTION: distribution } : {}),
  }
  return civ
}

function addWorkers(civ: Civilization, occupation: OccupationTypes, count: number): void {
  for (let i = 0; i < count; i++) {
    civ.addPeople(makeWorker(occupation, `${occupation}-${i}`))
  }
}

const weightOf = (civ: Civilization, type: BuildingTypes): number =>
  (civ['autoBuildCandidates']() as WeightedCandidate[]).find((c) => c.type === type)?.weight ?? 0

// ── Farm: target-driven weight ───────────────────────────────────────────────

describe('autoBuildCandidates: Farm target-driven weight', () => {
  it('bootstrap: farmer demand and no farm → weight > 0', () => {
    // 50 % of a 10-strong workforce → 5 farmers wanted, 0 capacity.
    const civ = makeCiv('Farm', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    expect(weightOf(civ, BuildingTypes.FARM)).toBeGreaterThan(0)
  })

  it('does not build when capacity already meets the target → weight 0', () => {
    // 1 farm (5 slots) covers the farmer target of 5 (50 % of 10).
    const civ = makeCiv('Farm', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(1))
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(0)
  })

  it('expands when the target exceeds capacity, with no surplus workers → weight > 0', () => {
    // The deadlock fix: 30-strong workforce → 15 farmers wanted, 1 farm (5) built,
    // 0 current farmers. Old surplus rule gave 0; target-driven gives a deficit.
    const civ = makeCiv('Farm', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    civ.addBuilding(new Farm(1))
    addWorkers(civ, OccupationTypes.GATHERER, 30)
    expect(weightOf(civ, BuildingTypes.FARM)).toBeGreaterThan(0)
  })

  it('counts a pending farm as capacity → no double-queue', () => {
    const civ = makeCiv('Farm', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    addWorkers(civ, OccupationTypes.GATHERER, 10) // farmer target 5
    civ.pendingConstructions.push({ buildingType: BuildingTypes.FARM, monthsRemaining: 3 })
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(0)
  })
})

// ── Library: target-driven weight ────────────────────────────────────────────

describe('autoBuildCandidates: Library target-driven weight', () => {
  it('bootstrap: erudit demand and no library → weight > 0', () => {
    const civ = makeCiv('Lib', { [OccupationTypes.GATHERER]: 80, [OccupationTypes.ERUDIT]: 20 })
    addWorkers(civ, OccupationTypes.GATHERER, 10) // erudit target 2
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBeGreaterThan(0)
  })

  it('does not build when the library covers the target → weight 0', () => {
    // 1 library (2 slots) covers an erudit target of 2 (20 % of 10).
    const civ = makeCiv('Lib', { [OccupationTypes.GATHERER]: 80, [OccupationTypes.ERUDIT]: 20 })
    civ.addBuilding(new Library(1))
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBe(0)
  })

  it('expands when the erudit target exceeds capacity → weight > 0', () => {
    // 50 % of 20 → 10 erudits wanted, 1 library (2) built.
    const civ = makeCiv('Lib', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.ERUDIT]: 50 })
    civ.addBuilding(new Library(1))
    addWorkers(civ, OccupationTypes.GATHERER, 20)
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBeGreaterThan(0)
  })
})

// ── Tech gating preserved ────────────────────────────────────────────────────

describe('auto-construction: tech gating preserved', () => {
  it('does not weight KILN or SAWMILL without CRAFTSMANSHIP, even with demand', () => {
    // Gauge wants carpenters and charcoal burners, but their buildings are locked.
    const civ = makeCiv('NoTech', {
      [OccupationTypes.WOODCUTTER]: 20,
      [OccupationTypes.CARPENTER]: 40,
      [OccupationTypes.CHARCOAL_BURNER]: 40,
    })
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    addWorkers(civ, OccupationTypes.WOODCUTTER, 20)

    civ['buildNewBuilding'](winterWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.KILN)).toBe(false)
    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.SAWMILL)).toBe(false)
  })
})

// ── Cache uniqueness and Mine tech-gating ────────────────────────────────────

describe('auto-construction: Cache uniqueness and Mine tech-gating', () => {
  it('does not queue a second Cache when one already exists', () => {
    const civ = makeCiv('WithCache')
    civ.addBuilding(new Cache())
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 1000))
    addWorkers(civ, OccupationTypes.GATHERER, 5)

    civ['buildNewBuilding'](summerWorld())

    const cacheJobs = civ.pendingConstructions.filter((c) => c.buildingType === BuildingTypes.CACHE)
    expect(cacheJobs.length).toBe(0)
  })

  it('does not queue MINE without MASONRY tech', () => {
    const civ = makeCiv('NoMasonry', {
      [OccupationTypes.GATHERER]: 50,
      [OccupationTypes.MINER]: 50,
    })
    civ.researchedTechs = [TechId.CRAFTSMANSHIP]
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    addWorkers(civ, OccupationTypes.GATHERER, 30)

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.MINE)).toBe(false)
  })
})

// ── Library integration ──────────────────────────────────────────────────────

describe('auto-construction: Library candidate (integration)', () => {
  it('queues a Library when erudits are wanted and resources are available', () => {
    const civ = makeCiv('LibTest', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.ERUDIT]: 50 })
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    expect(civ.library).toBeUndefined()

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY)).toBe(true)
  })

  it('queues a second Library when the erudit target exceeds capacity', () => {
    const civ = makeCiv('LibFull', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.ERUDIT]: 50 })
    civ.addBuilding(new Library(1)) // capacity 2
    addWorkers(civ, OccupationTypes.GATHERER, 20) // erudit target 10 → deficit 8
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY)).toBe(true)
  })
})

// ── Construction after the work phase (real-tick regression) ─────────────────

describe('auto-construction: builders remain available after the work phase', () => {
  it('still queues a building when workers already have hasWork=true', () => {
    // In a real passAMonth, extraction/production/research run BEFORE buildNewBuilding
    // and flag workers hasWork=true. Construction must reset that so it can mobilise
    // builders, otherwise nothing ever gets built.
    const civ = makeCiv('AfterWork', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.ERUDIT]: 50 })
    for (let i = 0; i < 10; i++) {
      const gatherer = makeWorker(OccupationTypes.GATHERER, `g-${i}`)
      gatherer.hasWork = true // already worked this month
      civ.addPeople(gatherer)
    }
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.length).toBeGreaterThan(0)
  })
})

// ── Survival takes priority over construction ────────────────────────────────

describe('auto-construction: survival takes priority over building', () => {
  it('does not start new construction when the civilization starved this month', () => {
    const civ = makeCiv('Starving', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.ERUDIT]: 50 })
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    // Simulate what resourceConsumption sets when a citizen cannot be fed.
    civ['_starvedThisMonth'] = true

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.length).toBe(0)
  })
})
