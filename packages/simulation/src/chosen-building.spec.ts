import { Civilization } from './civilization'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { BuildingTypes } from './buildings/enum'
import { Wall } from './buildings/wall'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'

const builders = (civ: Civilization, count: number) => {
  for (let i = 0; i < count; i++) {
    const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    p.id = `b-${i}`
    p.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(p)
  }
}

describe('player-chosen next building', () => {
  it('does not start the wall without enough builders, and keeps the request', () => {
    const civ = new Civilization('Keep')
    civ.config = { ...civ.config, NEXT_BUILDING_TO_BUILD: BuildingTypes.WALL }
    civ.addResource(new Resource(ResourceTypes.STONE, 5000), new Resource(ResourceTypes.WOOD, 5000))
    builders(civ, 10) // < Wall.minBuilders

    civ['buildNewBuilding']()

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.WALL)).toBe(false)
    expect(civ.config.NEXT_BUILDING_TO_BUILD).toBe(BuildingTypes.WALL)
  })

  it('starts the wall when builders and resources suffice, then clears the request', () => {
    const civ = new Civilization('Fortress')
    civ.config = { ...civ.config, NEXT_BUILDING_TO_BUILD: BuildingTypes.WALL }
    civ.addResource(new Resource(ResourceTypes.STONE, 5000), new Resource(ResourceTypes.WOOD, 5000))
    builders(civ, Wall.minBuilders + 10)

    civ['buildNewBuilding']()

    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.WALL)).toBe(true)
    expect(civ.config.NEXT_BUILDING_TO_BUILD).toBe(null)
  })
})
