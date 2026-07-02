/**
 * Production par citoyen : le métier produit, le bâtiment booste.
 *  - Fermier/Érudit : produisent sans bâtiment à rendement dégradé.
 *  - Commis/Charpentier/Charbonnier : rien sans leur bâtiment.
 */

import { Civilization } from '../../civilization'
import { Farm } from '../../buildings/farm'
import { Sawmill } from '../../buildings/sawmill'
import { Gender } from '../enum'
import { People } from '../people'
import { OccupationTypes } from './enum'
import { Resource, ResourceTypes } from '../../resource'
import { Builder, BUILDER_REQUIRED_AGE } from './builder'

const addWorkers = (civ: Civilization, occupation: OccupationTypes, count: number) => {
  for (let i = 0; i < count; i++) {
    const person = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    person.id = `${occupation}-${i}`
    person.setOccupation(occupation)
    civ.addPeople(person)
  }
}

describe('produceForOccupation : fermiers', () => {
  it('produit 12 nourriture par fermier sans ferme', () => {
    const civ = new Civilization('NoFarm')
    addWorkers(civ, OccupationTypes.FARMER, 3)

    civ['produceForOccupation'](OccupationTypes.FARMER)

    expect(civ.getResource(ResourceTypes.RAW_FOOD).quantity).toBe(36)
  })

  it('produit 20 nourriture par fermier boosté par la ferme', () => {
    const civ = new Civilization('FullFarm')
    civ.addBuilding(new Farm(1)) // 5 places
    addWorkers(civ, OccupationTypes.FARMER, 5)

    civ['produceForOccupation'](OccupationTypes.FARMER)

    expect(civ.getResource(ResourceTypes.RAW_FOOD).quantity).toBe(100)
  })

  it('mixe boostés et non boostés : 7 fermiers, 5 places → 5×20 + 2×12', () => {
    const civ = new Civilization('MixedFarm')
    civ.addBuilding(new Farm(1))
    addWorkers(civ, OccupationTypes.FARMER, 7)

    civ['produceForOccupation'](OccupationTypes.FARMER)

    expect(civ.getResource(ResourceTypes.RAW_FOOD).quantity).toBe(124)
  })
})

describe('produceForOccupation : métiers qui exigent leur bâtiment', () => {
  it('un charpentier sans scierie ne produit rien et ne consomme rien', () => {
    const civ = new Civilization('NoSawmill')
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    addWorkers(civ, OccupationTypes.CARPENTER, 2)

    civ['produceForOccupation'](OccupationTypes.CARPENTER)

    expect(civ.getResource(ResourceTypes.WOOD).quantity).toBe(100)
    expect(civ.getResource(ResourceTypes.PLANK).quantity).toBe(0)
  })

  it('une scierie pleine convertit comme avant : 1 bois → 5 planches', () => {
    const civ = new Civilization('FullSawmill')
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addBuilding(new Sawmill(1)) // 2 charpentiers
    addWorkers(civ, OccupationTypes.CARPENTER, 2)

    civ['produceForOccupation'](OccupationTypes.CARPENTER)

    expect(civ.getResource(ResourceTypes.WOOD).quantity).toBe(99)
    expect(civ.getResource(ResourceTypes.PLANK).quantity).toBe(5)
  })

  it('les intrants disponibles plafonnent la production', () => {
    const civ = new Civilization('NoWood')
    addWorkers(civ, OccupationTypes.CARPENTER, 2)
    civ.addBuilding(new Sawmill(1))
    // Aucun bois : rien ne sort.
    civ['produceForOccupation'](OccupationTypes.CARPENTER)

    expect(civ.getResource(ResourceTypes.PLANK).quantity).toBe(0)
  })
})

describe('Métier Constructeur', () => {
  it('a le bon type, ses âges, et ne produit rien (pas de conversion déclarée)', () => {
    const builder = new Builder()
    expect(builder.occupationType).toBe(OccupationTypes.BUILDER)
    expect(builder.canUpgrade(BUILDER_REQUIRED_AGE)).toBe(true)
    expect(builder.canUpgrade(BUILDER_REQUIRED_AGE - 1)).toBe(false)
    expect(builder.canWork(30)).toBe(true)
    expect(builder.canRetire(60)).toBe(true)

    const civ = new Civilization('Builders')
    addWorkers(civ, OccupationTypes.BUILDER, 3)
    civ['produceResources']()
    expect(civ.resources.every((resource) => resource.quantity === 0)).toBe(true)
  })
})
