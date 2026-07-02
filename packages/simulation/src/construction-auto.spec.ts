/**
 * Suite for the distribution-driven auto-construction system.
 *
 * Deux régimes de poids depuis « le métier produit, le bâtiment booste » :
 *  - Ferme et Bibliothèque sont des boosts : poids = travailleurs du métier NON
 *    boostés (effectif − places bâties − places en chantier).
 *  - Les bâtiments dont le métier est exigé (mine, feu de camp, scierie, four)
 *    gardent un poids piloté par la cible de la jauge (cible − places).
 *
 * Tests call the private `buildNewBuilding` / `autoBuildCandidates` via bracket
 * notation. Chance is forced to 100 % (CHANCE_TO_BUILD_EVOLVED_BUILDING = 100) so
 * every candidate whose weight > 0 is attempted. Les chantiers exigent désormais
 * des CONSTRUCTEURS (workerRequiredToBuild), ajoutés là où un chantier doit
 * réellement démarrer.
 */

import { Civilization } from './civilization'
import { BuildingTypes } from './buildings/enum'
import { Cache } from './buildings/cache'
import { Farm } from './buildings/farm'
import { House } from './buildings/house'
import { Library } from './buildings/library'
import { Mine } from './buildings/mine'
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

describe('autoBuildCandidates: Farm boost-driven weight', () => {
  it('unboosted farmers and no farm → weight > 0', () => {
    // 5 fermiers, aucune place bâtie : tous non boostés.
    const civ = makeCiv('Farm')
    addWorkers(civ, OccupationTypes.FARMER, 5)
    expect(weightOf(civ, BuildingTypes.FARM)).toBeGreaterThan(0)
  })

  it('does not build when every farmer is boosted → weight 0', () => {
    // 1 farm (5 slots) covers the 5 farmers.
    const civ = makeCiv('Farm')
    civ.addBuilding(new Farm(1))
    addWorkers(civ, OccupationTypes.FARMER, 5)
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(0)
  })

  it('expands when workers exceed built slots → weight > 0', () => {
    // 10 fermiers, 1 ferme (5 places) : 5 non boostés.
    const civ = makeCiv('Farm')
    civ.addBuilding(new Farm(1))
    addWorkers(civ, OccupationTypes.FARMER, 10)
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(5)
  })

  it('gatherers alone do not weight the farm (workers first, building second)', () => {
    // Sans fermiers, pas de besoin de boost : la jauge convertit d'abord des
    // fermiers (sans plafond bâtiment), la ferme suit.
    const civ = makeCiv('Farm', { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 })
    addWorkers(civ, OccupationTypes.GATHERER, 10)
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(0)
  })

  it('counts a pending farm as capacity → no double-queue', () => {
    const civ = makeCiv('Farm')
    addWorkers(civ, OccupationTypes.FARMER, 5)
    civ.pendingConstructions.push({ buildingType: BuildingTypes.FARM, monthsRemaining: 3 })
    expect(weightOf(civ, BuildingTypes.FARM)).toBe(0)
  })
})

// ── Library: target-driven weight ────────────────────────────────────────────

describe('autoBuildCandidates: Library boost-driven weight', () => {
  it('unboosted erudits and no library → weight > 0', () => {
    const civ = makeCiv('Lib')
    addWorkers(civ, OccupationTypes.ERUDIT, 2)
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBeGreaterThan(0)
  })

  it('does not build when the library boosts every erudit → weight 0', () => {
    // 1 library (2 slots) covers the 2 erudits.
    const civ = makeCiv('Lib')
    civ.addBuilding(new Library(1))
    addWorkers(civ, OccupationTypes.ERUDIT, 2)
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBe(0)
  })

  it('expands when erudits exceed built slots → weight > 0', () => {
    // 10 érudits, 1 bibliothèque (2 places) : 8 non boostés.
    const civ = makeCiv('Lib')
    civ.addBuilding(new Library(1))
    addWorkers(civ, OccupationTypes.ERUDIT, 10)
    expect(weightOf(civ, BuildingTypes.LIBRARY)).toBe(8)
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

  it('does not queue a second Mine when one already exists (unique building)', () => {
    const civ = makeCiv('WithMine', {
      [OccupationTypes.GATHERER]: 20,
      [OccupationTypes.MINER]: 80,
    })
    civ.researchedTechs = [TechId.CRAFTSMANSHIP, TechId.MASONRY]
    civ.addBuilding(new Mine(1))
    addWorkers(civ, OccupationTypes.GATHERER, 40) // cible mineurs 32 ≫ 10 slots

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.MINE)).toBe(false)
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
  it('queues a Library when unboosted erudits exist, builders and resources available', () => {
    const civ = makeCiv('LibTest')
    // Logement déjà couvert, sinon les constructeurs partent sur des tentes.
    civ.addBuilding(new House(4))
    addWorkers(civ, OccupationTypes.ERUDIT, 4)
    addWorkers(civ, OccupationTypes.BUILDER, 4)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    expect(civ.library).toBeUndefined()

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY)).toBe(true)
  })

  it('queues a second Library when erudits exceed the built slots', () => {
    const civ = makeCiv('LibFull')
    civ.addBuilding(new Library(1)) // capacity 2
    civ.addBuilding(new House(4)) // logement couvert (14 habitants)
    addWorkers(civ, OccupationTypes.ERUDIT, 10) // 8 non boostés
    addWorkers(civ, OccupationTypes.BUILDER, 4)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.LIBRARY)).toBe(true)
  })

  it('does NOT queue a Library without builders, even with unboosted erudits', () => {
    const civ = makeCiv('LibNoBuilder')
    addWorkers(civ, OccupationTypes.ERUDIT, 4)
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    civ['buildNewBuilding'](summerWorld())

    expect(civ.pendingConstructions).toHaveLength(0)
  })
})

// ── Construction after the work phase (real-tick regression) ─────────────────

describe('auto-construction: builders remain available after the work phase', () => {
  it('still queues a building when workers already have hasWork=true', () => {
    // In a real passAMonth, extraction/production/research run BEFORE buildNewBuilding
    // and flag workers hasWork=true. Construction must reset that so it can mobilise
    // the constructeurs, otherwise nothing ever gets built.
    const civ = makeCiv('AfterWork')
    for (let i = 0; i < 4; i++) {
      const builder = makeWorker(OccupationTypes.BUILDER, `b-${i}`)
      builder.hasWork = true // already worked this month
      civ.addPeople(builder)
    }
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))

    // Déficit de logement → les constructeurs doivent lancer des tentes malgré
    // leur hasWork=true.
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
