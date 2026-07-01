/**
 * TDD suite for the data-driven auto-construction system.
 *
 * Tests call the private `buildNewBuilding` / `autoBuildCandidates` via bracket
 * notation. Chance is forced to 100 % by setting CHANCE_TO_BUILD_EVOLVED_BUILDING
 * = 100 so every candidate whose weight > 0 is attempted.
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

/** Baseline civilization with the chance forced to 100 % so every candidate fires. */
function makeCiv(name = 'TestCiv'): Civilization {
  const civ = new Civilization(name)
  civ.config = { ...civ.config, CHANCE_TO_BUILD_EVOLVED_BUILDING: 100 }
  return civ
}

// ── Test 1: expansionWeight — Farm ───────────────────────────────────────────

describe('autoBuildCandidates: Farm expansion weight', () => {
  it('bootstrap: no farm → weight > 0', () => {
    const civ = makeCiv()
    // No farm, no pending farm
    const candidates = civ['autoBuildCandidates']()
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!
    expect(farm.weight).toBeGreaterThan(0)
  })

  it('does not expand: 1 farm + 3 farmers (< 5 capacity) → weight === 0', () => {
    const civ = makeCiv()
    civ.addBuilding(new Farm(1))
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.FARMER, `f-${i}`))
    }
    const candidates = civ['autoBuildCandidates']()
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!
    // 1 farm × 5 slots = 5 capacity; 3 farmers < 5 → no surplus → weight 0
    expect(farm.weight).toBe(0)
  })

  it('expands: 1 farm + 6 farmers (surplus 1) → weight > 0', () => {
    const civ = makeCiv()
    civ.addBuilding(new Farm(1))
    for (let i = 0; i < 6; i++) {
      civ.addPeople(makeWorker(OccupationTypes.FARMER, `f-${i}`))
    }
    const candidates = civ['autoBuildCandidates']()
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!
    // 1 farm × 5 slots = 5; 6 farmers → surplus 1 → weight > 0
    expect(farm.weight).toBeGreaterThan(0)
  })

  it('pending farm counts as capacity: 0 built + 1 pending → weight === 0 (no bootstrap of 2nd)', () => {
    const civ = makeCiv()
    // Simulate a pending construction without resources/workers (direct push)
    civ.pendingConstructions.push({ buildingType: BuildingTypes.FARM, monthsRemaining: 3 })
    const candidates = civ['autoBuildCandidates']()
    const farm = candidates.find((c) => c.type === BuildingTypes.FARM)!
    // totalCount = 0 built + 1 pending = 1 → not 0 → no bootstrap;
    // 0 farmers → surplus = 0 - 5 = -5 → weight 0
    expect(farm.weight).toBe(0)
  })
})

// ── Test 2: expansionWeight — Library ────────────────────────────────────────

describe('autoBuildCandidates: Library expansion weight', () => {
  it('bootstrap: no library → weight > 0', () => {
    const civ = makeCiv()
    const candidates = civ['autoBuildCandidates']()
    const lib = candidates.find((c) => c.type === BuildingTypes.LIBRARY)!
    expect(lib.weight).toBeGreaterThan(0)
  })

  it('no expansion: 1 library + 2 erudits (exactly full) → weight === 0', () => {
    const civ = makeCiv()
    civ.addBuilding(new Library(1))
    for (let i = 0; i < 2; i++) {
      civ.addPeople(makeWorker(OccupationTypes.ERUDIT, `e-${i}`))
    }
    const candidates = civ['autoBuildCandidates']()
    const lib = candidates.find((c) => c.type === BuildingTypes.LIBRARY)!
    // 1 library × 2 slots = 2; 2 erudits → surplus 0 → weight 0
    expect(lib.weight).toBe(0)
  })

  it('expands: 1 library + 3 erudits (surplus 1) → weight > 0', () => {
    const civ = makeCiv()
    civ.addBuilding(new Library(1))
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.ERUDIT, `e-${i}`))
    }
    const candidates = civ['autoBuildCandidates']()
    const lib = candidates.find((c) => c.type === BuildingTypes.LIBRARY)!
    // 1 library × 2 slots = 2; 3 erudits → surplus 1 → weight > 0
    expect(lib.weight).toBeGreaterThan(0)
  })
})

// ── Test 3: Gated buildings (Kiln, Sawmill, Mine) never auto-build without tech ─

describe('auto-construction: tech gating preserved', () => {
  it('does not build KILN or SAWMILL without CRAFTSMANSHIP, even at 100 % chance', () => {
    const civ = makeCiv('NoTech')
    // No technologies researched → KILN and SAWMILL are locked

    // Winter world (passes as _world but is now unused internally)
    const world = winterWorld()

    // Abundant resources and woodcutters/charcoal burners (so weight would be > 0 if unlocked)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    for (let i = 0; i < 10; i++) {
      civ.addPeople(makeWorker(OccupationTypes.WOODCUTTER, `wc-${i}`))
    }
    for (let i = 0; i < 10; i++) {
      civ.addPeople(makeWorker(OccupationTypes.CHARCOAL_BURNER, `cb-${i}`))
    }
    for (let i = 0; i < 10; i++) {
      civ.addPeople(makeWorker(OccupationTypes.CARPENTER, `cp-${i}`))
    }

    civ['buildNewBuilding'](world)

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.KILN),
    ).toBe(false)
    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.SAWMILL),
    ).toBe(false)
  })
})

// ── Test 4: Cache uniqueness and Mine tech-gating ────────────────────────────

describe('auto-construction: Cache uniqueness and Mine tech-gating', () => {
  it('does not queue a second Cache when one already exists', () => {
    const civ = makeCiv('WithCache')
    civ.addBuilding(new Cache())
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 1000))
    for (let i = 0; i < 5; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }

    civ['buildNewBuilding'](summerWorld())

    const cacheJobs = civ.pendingConstructions.filter(
      (c) => c.buildingType === BuildingTypes.CACHE,
    )
    expect(cacheJobs.length).toBe(0)
  })

  it('does not queue MINE without MASONRY tech', () => {
    const civ = makeCiv('NoMasonry')
    civ.researchedTechs = [TechId.CRAFTSMANSHIP]

    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    for (let i = 0; i < 10; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.MINE),
    ).toBe(false)
  })
})

// ── Test 5: Library bootstrap via buildNewBuilding (integration) ─────────────

describe('auto-construction: Library candidate (integration)', () => {
  it('queues a Library when there is no library, enough gatherers and resources', () => {
    const civ = makeCiv('LibTest')

    // 6 gatherers: Campfire (bootstrap=4) will claim 2, leaving 4 free for Library (needs 2).
    // Sawmill is locked (no CRAFTSMANSHIP). Farm needs PLANK (not provided) → can't build.
    // CACHE needs 200 WOOD + 600 PLANK + 15 gatherers → can't build (only 100 WOOD, no PLANK).
    for (let i = 0; i < 6; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }

    // Library costs: 15 WOOD + 10 STONE; Campfire costs: 15 WOOD.
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))

    expect(civ.library).toBeUndefined()

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY),
    ).toBe(true)
  })

  it('queues a second Library when erudits overflow (1 library + 3 erudits)', () => {
    const civ = makeCiv('LibFull')

    // One existing library (count=1) → 2 erudit slots. 3 erudits → surplus 1 → weight 1 > 0.
    civ.addBuilding(new Library(1))
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.ERUDIT, `e-${i}`))
    }
    // Add enough gatherers (6) to satisfy Library.workerRequiredToBuild (2 gatherers) even if
    // Campfire bootstrap (no campfire → weight 4) claims 2 of them first.
    for (let i = 0; i < 6; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY),
    ).toBe(true)
  })
})

// ── Test 6: construction after the work phase (real-tick regression) ─────────

describe('auto-construction: builders remain available after the work phase', () => {
  it('still queues a building when workers already have hasWork=true', () => {
    // In a real passAMonth, extraction/production/research run BEFORE
    // buildNewBuilding and flag their workers hasWork=true. Construction must
    // still be able to mobilise workers, otherwise nothing ever gets built.
    const civ = makeCiv('AfterWork')
    for (let i = 0; i < 6; i++) {
      const gatherer = makeWorker(OccupationTypes.GATHERER, `g-${i}`)
      gatherer.hasWork = true // already worked this month
      civ.addPeople(gatherer)
    }
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.length).toBeGreaterThan(0)
  })
})

// ── Test 7: survival takes priority over construction ────────────────────────

describe('auto-construction: survival takes priority over building', () => {
  it('does not start new construction when the civilization starved this month', () => {
    const civ = makeCiv('Starving')
    for (let i = 0; i < 6; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }
    // Resources that would otherwise let it build (e.g. a Library / Campfire).
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))
    // Simulate what resourceConsumption sets when a citizen cannot be fed.
    civ['_starvedThisMonth'] = true

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.length).toBe(0)
  })
})
