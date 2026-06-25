import { Civilization } from './civilization'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { House } from './buildings/house'
import { BuildingTypes } from './buildings/enum'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'
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

  it('activates the building once its countdown reaches zero', async () => {
    const world = healthyWorld()
    const civ = buildCivilizationNeedingHouses()
    world.addCivilization(civ)

    for (let month = 0; month < House.timeToBuild + 1; month++) {
      await world.passAMonth()
    }

    const houses = civ.buildings.find((b) => b.getType() === BuildingTypes.HOUSE)
    expect(houses?.count ?? 0).toBeGreaterThan(0)
  })
})
