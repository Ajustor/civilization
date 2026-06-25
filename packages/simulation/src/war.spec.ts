import { World, WorldConfig } from './world'
import { Civilization } from './civilization'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { Wall } from './buildings/wall'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'

const peaceConfig: WorldConfig = { BASE_FOOD_GENERATION: 0, BASE_WOOD_GENERATION: 0, EVENT_CHANCE: 0 }

const army = (civ: Civilization, soldiers: number, civilians: number) => {
  for (let i = 0; i < soldiers; i++) {
    const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    p.id = `${civ.id}-s-${i}`
    p.setOccupation(OccupationTypes.SOLDIER)
    civ.addPeople(p)
  }
  for (let i = 0; i < civilians; i++) {
    const p = new People({ month: 12 * 30, gender: Gender.FEMALE, lifeCounter: 10 })
    p.id = `${civ.id}-c-${i}`
    p.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(p)
  }
}

const makeWorld = () => new World('W', 0, peaceConfig)

describe('resolveWars', () => {
  it('a strong attacker plunders resources and captures people from a defenceless target', () => {
    const world = makeWorld()
    const attacker = new Civilization('Attacker'); attacker.id = 'att'
    const defender = new Civilization('Defender'); defender.id = 'def'
    attacker.config = { ...attacker.config, AT_WAR_WITH: ['def'] }
    army(attacker, 20, 10)
    army(defender, 0, 30)
    defender.addResource(new Resource(ResourceTypes.WOOD, 1000))
    world.addCivilization(attacker, defender)

    const attackerPopBefore = attacker.people.length

    ;(world as unknown as { resolveWars: () => void }).resolveWars()

    expect(defender.getResource(ResourceTypes.WOOD).quantity).toBeLessThan(1000)
    expect(attacker.people.length).toBeGreaterThan(attackerPopBefore)
  })

  it('a wall blocks the attack and is consumed', () => {
    const world = makeWorld()
    const attacker = new Civilization('Attacker'); attacker.id = 'att'
    const defender = new Civilization('Defender'); defender.id = 'def'
    attacker.config = { ...attacker.config, AT_WAR_WITH: ['def'] }
    army(attacker, 20, 0)
    army(defender, 0, 20)
    defender.addBuilding(new Wall(1))
    defender.addResource(new Resource(ResourceTypes.WOOD, 1000))
    world.addCivilization(attacker, defender)

    ;(world as unknown as { resolveWars: () => void }).resolveWars()

    expect(defender.getResource(ResourceTypes.WOOD).quantity).toBe(1000)
    expect(defender.wall?.count ?? 0).toBe(0)
  })

  it('does nothing without an AT_WAR_WITH declaration', () => {
    const world = makeWorld()
    const a = new Civilization('A'); a.id = 'a'
    const b = new Civilization('B'); b.id = 'b'
    army(a, 20, 0); army(b, 0, 20)
    b.addResource(new Resource(ResourceTypes.WOOD, 1000))
    world.addCivilization(a, b)

    ;(world as unknown as { resolveWars: () => void }).resolveWars()

    expect(b.getResource(ResourceTypes.WOOD).quantity).toBe(1000)
  })
})
