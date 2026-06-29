import { Farm } from './farm'
import { Campfire } from './campfire'
import { Sawmill } from './sawmill'
import { Kiln } from './kiln'
import { Library } from './library'
import { House } from './house'
import { Cache } from './cache'
import { ResourceTypes } from '../resource'
import { OccupationTypes } from '../people/work/enum'

describe('Métadonnées de production des bâtiments', () => {
  it('Ferme : 100 nourriture brute, exploitée par 5 fermiers', () => {
    const farm = new Farm(1)
    expect(farm.outputResources).toEqual([{ amount: 100, resource: ResourceTypes.RAW_FOOD }])
    expect(farm.workerTypeRequired).toEqual([{ occupation: OccupationTypes.FARMER, count: 5 }])
    expect(Farm.constructionCosts).toEqual([
      { resource: ResourceTypes.PLANK, amount: 10 },
      { resource: ResourceTypes.STONE, amount: 10 },
    ])
  })

  it('Feu de camp : 10 nourriture brute → 7 préparée, 1 commis de cuisine', () => {
    const campfire = new Campfire(1)
    expect(campfire.inputResources).toEqual([{ resource: ResourceTypes.RAW_FOOD, amount: 10 }])
    expect(campfire.outputResources).toEqual([{ amount: 7, resource: ResourceTypes.COOKED_FOOD }])
    expect(campfire.workerTypeRequired).toEqual([{ occupation: OccupationTypes.KITCHEN_ASSISTANT, count: 1 }])
  })

  it('Scierie : 1 bois → 5 planches ; Four à chaux : 5 bois → 10 charbon', () => {
    expect(new Sawmill(1).outputResources).toEqual([{ resource: ResourceTypes.PLANK, amount: 5 }])
    expect(new Kiln(1).outputResources).toEqual([{ resource: ResourceTypes.CHARCOAL, amount: 10 }])
  })

  it('Bibliothèque : 2 points de recherche, 2 érudits', () => {
    expect(Library.researchOutput).toBe(2)
    expect(new Library(1).workerTypeRequired).toEqual([{ occupation: OccupationTypes.ERUDIT, count: 2 }])
  })

  it('Maison : capacité 4', () => {
    expect(House.capacity).toBe(4)
  })

  it('Entrepôt : coût et temps réels (non « gratuit »)', () => {
    expect(Cache.timeToBuild).toBe(6)
    expect(Cache.constructionCosts).toEqual([
      { amount: 200, resource: ResourceTypes.WOOD },
      { amount: 600, resource: ResourceTypes.PLANK },
    ])
  })
})
