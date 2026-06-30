import { Civilization } from '../civilization'
import { People } from '../people/people'
import { Resource, ResourceTypes } from '../resource'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'
import { Migration } from './migration'
import type { World } from '../world'

type MakeOptions = { soldiers?: number; food?: number }

const makeCivilization = (
  id: string,
  population: number,
  { soldiers = 0, food = 100_000 }: MakeOptions = {},
): Civilization => {
  const civilization = new Civilization(id)
  civilization.id = id
  for (let i = 0; i < population; i++) {
    const person = new People({ month: 12 * 25, gender: Gender.FEMALE, lifeCounter: 10 })
    person.id = `${id}-${i}`
    person.setOccupation(i < soldiers ? OccupationTypes.SOLDIER : OccupationTypes.GATHERER)
    civilization.addPeople(person)
  }
  civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, food))
  return civilization
}

const makeWorld = (civilizations: Civilization[]): World => {
  const byId = new Map(civilizations.map((civ) => [civ.id, civ]))
  return { getCivilization: (id: string) => byId.get(id) } as unknown as World
}

const totalPopulation = (civilizations: Civilization[]) =>
  civilizations.reduce((sum, civ) => sum + civ.people.length, 0)

describe('Migration', () => {
  describe('computeBorderRetention', () => {
    const migration = new Migration()

    it('retains nobody without soldiers', () => {
      expect(migration.computeBorderRetention(0, 100)).toBe(0)
    })

    it('scales linearly below the cap (5% soldiers → 20%)', () => {
      expect(migration.computeBorderRetention(5, 100)).toBeCloseTo(0.2)
    })

    it('caps at 100% once the soldier ratio is high enough', () => {
      expect(migration.computeBorderRetention(25, 100)).toBe(1)
      expect(migration.computeBorderRetention(80, 100)).toBe(1)
    })

    it('retains nobody for an empty population', () => {
      expect(migration.computeBorderRetention(0, 0)).toBe(0)
    })
  })

  describe('computeAttractiveness', () => {
    const migration = new Migration()

    it('makes a civilization at war less attractive than a peaceful one (same food)', () => {
      const peaceful = makeCivilization('peace', 100)
      const atWar = makeCivilization('war', 100)
      atWar.config = { ...atWar.config, AT_WAR_WITH: ['enemy'] }
      expect(migration.computeAttractiveness(atWar)).toBeLessThan(
        migration.computeAttractiveness(peaceful),
      )
    })
  })

  describe('actions', () => {
    it('conserves total population (unplaced migrants return home, no silent loss)', () => {
      const precarious = makeCivilization('precarious', 150, { food: 100 })
      const prosperous = makeCivilization('prosperous', 150, { food: 1_000_000 })
      const civilizations = [precarious, prosperous]
      const before = totalPopulation(civilizations)

      new Migration().actions({ world: makeWorld(civilizations), civilizations })

      expect(totalPopulation(civilizations)).toBe(before)
    })

    it('soldiers guarding the border prevent departures from their civilization', () => {
      // Fully militarised + precarious: retention is 100%, so nobody leaves.
      const guarded = makeCivilization('guarded', 150, { food: 1, soldiers: 150 })
      const prosperous = makeCivilization('prosperous', 150, { food: 1_000_000 })
      const civilizations = [guarded, prosperous]

      new Migration().actions({ world: makeWorld(civilizations), civilizations })

      // The guarded civ loses no one to migration (it can only stay or grow).
      expect(guarded.people.length).toBeGreaterThanOrEqual(150)
    })
  })
})
