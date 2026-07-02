import { Civilization, defaultCivilizationConfig } from './civilization'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { House } from './buildings/house'
import { Tent } from './buildings/tent'
import { BuildingTypes } from './buildings/enum'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'
import { TechId } from './technology/techTree'
import { World } from './world'

const healthyWorld = () => {
  const world = new World('W', 0, {
    BASE_FOOD_GENERATION: 0,
    BASE_WOOD_GENERATION: 0,
    EVENT_CHANCE: 0,
  })
  return world
}

const buildCivilizationNeedingHouses = () => {
  const civ = new Civilization('Builders')
  // La Maison est désormais gardée par la recherche Construction et consomme
  // une tente par chantier : on fournit la recherche et un déficit de tentes
  // (3 tentes = 6 places pour 10 habitants).
  civ.researchedTechs = [TechId.CONSTRUCTION]
  civ.addBuilding(new Tent(3))
  civ.addResource(
    new Resource(ResourceTypes.RAW_FOOD, 1_000_000),
    new Resource(ResourceTypes.COOKED_FOOD, 1_000_000),
    new Resource(ResourceTypes.WOOD, 1_000_000),
  )
  for (let i = 0; i < 10; i++) {
    const person = new People({
      month: 12 * 25,
      gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      lifeCounter: 50,
    })
    person.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(person)
  }
  return civ
}

describe('uniform construction pipeline', () => {
  it('queues a house as pending instead of building it instantly', async () => {
    const world = healthyWorld()
    const civ = buildCivilizationNeedingHouses()
    world.addCivilization(civ)

    expect(civ.buildings.filter((b) => b.getType() === BuildingTypes.HOUSE)).toHaveLength(0)

    await world.passAMonth()

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.HOUSE)).toBe(true)
    const houses = civ.buildings.find((b) => b.getType() === BuildingTypes.HOUSE)
    expect(houses?.count ?? 0).toBe(0)
  })

  it('activates buildings without wildly over-building once countdowns reach zero', async () => {
    const world = healthyWorld()
    const civ = buildCivilizationNeedingHouses()
    world.addCivilization(civ)

    for (let month = 0; month < House.timeToBuild + 4; month++) {
      await world.passAMonth()
    }

    const houses = civ.buildings.find((b) => b.getType() === BuildingTypes.HOUSE)
    // 10 habitants, 3 tentes (6 places) → déficit 4. Chaque maison consomme une
    // tente (gain net +2) → 2 maisons lancées le premier mois. Le pending compte
    // dans la capacité effective, donc le même déficit n'est pas re-queué.
    expect(houses?.count ?? 0).toBeGreaterThanOrEqual(2)
    expect(houses?.count ?? 0).toBeLessThanOrEqual(6)
  })

  it('never queues a second MINE while one is already pending', async () => {
    // A unique building (MINE) is existence-gated AND now deferred. The only
    // thing that keeps the pending MINE count at exactly one — while a mine is
    // in flight (`this.mine?.count` is still 0) — is the
    // `!isBuildingPending(MINE)` guard added to buildNewBuilding.
    //
    // For the guard to be load-bearing, the build must actually be able to
    // succeed each month. Building a mine needs 5 distinct GATHERER builders,
    // and buildNew de-duplicates candidate workers by `id`; People built via
    // the raw constructor share an undefined id, so we assign unique ids here
    // so 5 separate gatherers really are selected. We let housing settle first
    // (build chance 0) so no gatherers are tied up on house chantiers, then
    // raise the chance to 100 and seed a long-running pending MINE. Without the
    // guard, buildNew would now queue a fresh mine every month.
    const world = healthyWorld()
    const civ = new Civilization('Miners', {
      ...defaultCivilizationConfig,
      OPEN_EXCHANGE: [...defaultCivilizationConfig.OPEN_EXCHANGE],
      CHANCE_TO_BUILD_EVOLVED_BUILDING: 0,
      CHANCE_TO_EVOLVE: 0,
    })
    civ.addResource(
      new Resource(ResourceTypes.RAW_FOOD, 1_000_000),
      new Resource(ResourceTypes.COOKED_FOOD, 1_000_000),
      new Resource(ResourceTypes.WOOD, 1_000_000),
    )
    for (let i = 0; i < 20; i++) {
      const person = new People({
        month: 12 * 25,
        gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
        lifeCounter: 50,
      })
      person.id = `gatherer-${i}`
      person.setOccupation(OccupationTypes.GATHERER)
      civ.addPeople(person)
    }
    world.addCivilization(civ)

    // Let housing settle so no gatherers stay tied up on house chantiers.
    for (let month = 0; month < House.timeToBuild + 2; month++) {
      await world.passAMonth()
    }

    // Now the build attempt would succeed every month (free distinct builders +
    // 100% chance), so only the pending-guard can keep the mine count at one.
    // Seed a mine that stays in flight for the rest of the run.
    civ.config.CHANCE_TO_BUILD_EVOLVED_BUILDING = 100
    civ.pendingConstructions.push({
      buildingType: BuildingTypes.MINE,
      monthsRemaining: 1_000,
    })

    for (let month = 0; month < 6; month++) {
      await world.passAMonth()
      const pendingMines = civ.pendingConstructions.filter(
        (pending) => pending.buildingType === BuildingTypes.MINE,
      ).length
      // The existence + pending guard must never allow a duplicate queue entry.
      expect(pendingMines).toBe(1)
    }
  })
})

import { CivilizationBuilder } from './builders/civilizationBuilder'
import { formatCivilizations } from './formatters'

describe('pending construction round-trip', () => {
  it('builder restores pending constructions and formatter exposes them', () => {
    const civ = new CivilizationBuilder()
      .withName('Restored')
      .withPendingConstructions([
        { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
      ])
      .build()

    expect(civ.pendingConstructions).toEqual([
      { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
    ])

    const [formatted] = formatCivilizations([civ])
    expect(formatted.pendingConstructions).toEqual([
      { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
    ])
  })
})
