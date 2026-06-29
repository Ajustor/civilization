/**
 * TDD suite for the data-driven auto-construction system.
 *
 * Tests call the private `buildNewBuilding(world)` via bracket notation.
 * Chance is forced to 100 % by setting CHANCE_TO_BUILD_EVOLVED_BUILDING = 100
 * so every candidate whose weight > 0 is attempted.
 */

import { Civilization } from './civilization'
import { BuildingTypes } from './buildings/enum'
import { Cache } from './buildings/cache'
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

// ── Test 1: Library becomes an auto-build candidate ─────────────────────────

describe('auto-construction: Library candidate', () => {
  it('queues a Library when there are enough gatherers, resources, and no library yet', () => {
    const civ = makeCiv('LibTest')

    // 2 gatherers able to work (Library.workerRequiredToBuild = 2 gatherers)
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }

    // Library costs: 15 WOOD + 10 STONE
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))
    // RAW_FOOD just above 5×pop (3 citizens → target=15) so Farm weight=0.
    // Keep it below 20 so Campfire weight=0 (condition: stock >= 20).
    // This ensures no other building competes for the gatherers.
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 16))

    // No library exists → libraryWeight = 2 (libraryCount === 0)
    expect(civ.library).toBeUndefined()

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY),
    ).toBe(true)
  })

  it('gives a higher weight when erudits exceed current library slots', () => {
    const civ = makeCiv('LibFull')

    // One existing library (count=1) → 2 erudit slots; add 3 erudits → overflow
    civ.addBuilding(new Library(1))
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.ERUDIT, `e-${i}`))
    }
    // Also add gatherers to satisfy workerRequiredToBuild
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addResource(new Resource(ResourceTypes.STONE, 100))
    // Keep RAW_FOOD just above 5×pop but below 20 so Campfire and Farm weights = 0,
    // avoiding competition for the 2 gatherers Library needs.
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 16))

    civ['buildNewBuilding'](summerWorld())

    // Should have queued a second Library due to erudit overflow (weight = 5)
    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY),
    ).toBe(true)
  })
})

// ── Test 2: Gated buildings (Kiln, Sawmill) never auto-build without tech ───

describe('auto-construction: tech gating preserved', () => {
  it('does not build KILN or SAWMILL without CRAFTSMANSHIP, even at 100 % chance', () => {
    const civ = makeCiv('NoTech')
    // No technologies researched → KILN and SAWMILL are locked

    // Winter world → Kiln gets heating-season bonus (if it had weight)
    const world = winterWorld()

    // Abundant resources and workers
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    civ.addResource(new Resource(ResourceTypes.PLANK, 0))
    civ.addResource(new Resource(ResourceTypes.CHARCOAL, 0))
    for (let i = 0; i < 10; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
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

// ── Test 3: Weight 0 → no construction ──────────────────────────────────────

describe('auto-construction: weight 0 suppresses build', () => {
  it('does not queue FARM when raw food stock already covers 5× population', () => {
    const civ = makeCiv('WellFed')
    // Population of 3 → target = 5 * 3 = 15; stock = 100 >> 15 → needWeight = 0
    for (let i = 0; i < 3; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }
    // Abundant raw food → Farm weight = 0
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.FARM),
    ).toBe(false)
  })
})

// ── Test 4: Cache and Mine gating preserved ──────────────────────────────────

describe('auto-construction: Cache uniqueness and Mine tech-gating', () => {
  it('does not queue a second Cache when one already exists', () => {
    const civ = makeCiv('WithCache')
    // Cache is created by default in some civilizations, but let's be explicit:
    // add a cache so cache.count = 1
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
    // Has CRAFTSMANSHIP but not MASONRY → MINE still locked
    civ.researchedTechs = [TechId.CRAFTSMANSHIP]

    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    for (let i = 0; i < 5; i++) {
      civ.addPeople(makeWorker(OccupationTypes.GATHERER, `g-${i}`))
    }

    civ['buildNewBuilding'](summerWorld())

    expect(
      civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.MINE),
    ).toBe(false)
  })
})
