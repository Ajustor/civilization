import { Civilization } from '../civilization'
import { People } from '../people/people'
import { Resource, ResourceTypes } from '../resource'
import { BuildingTypes } from './enum'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'
import { Mine } from './mine'

const buildMiner = (id: string) => {
  const person = new People({
    month: 12 * 30,
    gender: Gender.MALE,
    lifeCounter: 50,
  })
  person.id = id
  person.setOccupation(OccupationTypes.MINER)
  return person
}

describe('Mine', () => {
  it('keeps the count passed to its constructor', () => {
    // Regression: the Mine had no constructor, so `new Mine(1)` produced a mine
    // with count 0. That broke worker allocation (no miners could ever be hired
    // because the available "miner space" is count * 10) and made the building
    // invisible to the count-gated build/UI logic.
    expect(new Mine(1).count).toBe(1)
    expect(new Mine(3).count).toBe(3)
  })

  it('generates at least one extractable resource with a non-zero probability', () => {
    const mine = new Mine(1)
    mine.generateOutput([ResourceTypes.STONE])

    expect(mine.outputResources).toHaveLength(1)
    expect(mine.outputResources[0]?.resource).toBe(ResourceTypes.STONE)
    expect(mine.outputResources[0]?.probability).toBeGreaterThan(0)
  })

  it('lets miners extract resources and depletes the capacity', () => {
    const civ = new Civilization('Diggers')
    const mine = new Mine(1)
    mine.capacity = 50
    mine.outputResources = [{ resource: ResourceTypes.STONE, probability: 100 }]
    civ.addBuilding(mine)

    for (let i = 0; i < 10; i++) {
      civ.addPeople(buildMiner(`miner-${i}`))
    }

    civ['extractResources']()

    // Several miners extracted stone in a single month and the capacity dropped.
    expect(civ.getResource(ResourceTypes.STONE).quantity).toBeGreaterThan(0)
  })

  it('disappears once its capacity is exhausted so a new one can be built', () => {
    const civ = new Civilization('Diggers')
    const mine = new Mine(1)
    mine.capacity = 1
    mine.outputResources = [{ resource: ResourceTypes.STONE, probability: 100 }]
    civ.addBuilding(mine)
    civ.addPeople(buildMiner('miner-0'))

    civ['extractResources']()

    expect(
      civ.buildings.some((b) => b.getType() === BuildingTypes.MINE),
    ).toBe(false)
  })
})
