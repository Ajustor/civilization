import { BountifulHarvest } from './bountifulHarvest'
import { TradeCaravan } from './tradeCaravan'
import { FortunateDiscovery } from './fortunateDiscovery'
import { GoldenAge } from './goldenAge'
import { Civilization } from '../civilization'
import { People } from '../people/people'
import { Resource, ResourceTypes } from '../resource'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'

const makeCivilization = (id: string, population: number): Civilization => {
  const civilization = new Civilization(id)
  civilization.id = id
  for (let i = 0; i < population; i++) {
    const person = new People({ month: 12 * 25, gender: Gender.FEMALE, lifeCounter: 10 })
    person.id = `${id}-${i}`
    person.setOccupation(OccupationTypes.GATHERER)
    civilization.addPeople(person)
  }
  return civilization
}

describe('positive events', () => {
  describe('BountifulHarvest', () => {
    it('increases raw food proportionally to the population (pop × 3..6)', () => {
      const civilization = makeCivilization('civ', 100)
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 0))

      new BountifulHarvest().actions({ civilizations: [civilization], world: undefined as never })

      const food = civilization.getResource(ResourceTypes.RAW_FOOD).quantity
      expect(food).toBeGreaterThanOrEqual(100 * 3)
      expect(food).toBeLessThanOrEqual(100 * 6)
    })
  })

  describe('TradeCaravan', () => {
    it('adds wood and stone to the civilization', () => {
      const civilization = makeCivilization('civ', 100)

      new TradeCaravan().actions({ civilizations: [civilization], world: undefined as never })

      const wood = civilization.getResource(ResourceTypes.WOOD).quantity
      const stone = civilization.getResource(ResourceTypes.STONE).quantity
      expect(wood).toBeGreaterThanOrEqual(100 * 2)
      expect(wood).toBeLessThanOrEqual(100 * 4)
      expect(stone).toBeGreaterThanOrEqual(100 * 1)
      expect(stone).toBeLessThanOrEqual(100 * 2)
    })
  })

  describe('FortunateDiscovery', () => {
    it('adds research points proportionally to the population (pop × 1..3)', () => {
      const civilization = makeCivilization('civ', 100)
      const before = civilization.researchPoints

      new FortunateDiscovery().actions({ civilizations: [civilization], world: undefined as never })

      const gained = civilization.researchPoints - before
      expect(gained).toBeGreaterThanOrEqual(100 * 1)
      expect(gained).toBeLessThanOrEqual(100 * 3)
    })
  })

  describe('GoldenAge', () => {
    it('adds a wave of native settlers (ceil(pop × 3..6%)) who are not captives', () => {
      const civilization = makeCivilization('civ', 200)
      const populationBefore = civilization.people.length

      new GoldenAge().actions({ civilizations: [civilization], world: undefined as never })

      const newcomers = civilization.people.length - populationBefore
      expect(newcomers).toBeGreaterThanOrEqual(Math.ceil(200 * 0.03))
      expect(newcomers).toBeLessThanOrEqual(Math.ceil(200 * 0.06))

      const settlers = civilization.people.filter((person) => person.originCivilizationId === 'civ')
      expect(settlers).toHaveLength(newcomers)
      // Native settlers must not be flagged as captives (their origin is this civ).
      for (const settler of settlers) {
        expect(settler.originCivilizationId).toBe('civ')
        expect(settler.work).not.toBeNull()
      }
    })
  })
})
