import { Erudit } from './people/work/erudit'
import { OccupationTypes } from './people/work/enum'

describe('Erudit work', () => {
  it('has the ERUDIT occupation type', () => {
    expect(new Erudit().occupationType).toBe(OccupationTypes.ERUDIT)
  })
  it('can work before 70 and retires at 70', () => {
    const erudit = new Erudit()
    expect(erudit.canWork(40)).toBe(true)
    expect(erudit.canWork(70)).toBe(false)
    expect(erudit.canRetire(70)).toBe(true)
  })
  it('can upgrade after 21', () => {
    expect(new Erudit().canUpgrade(22)).toBe(true)
    expect(new Erudit().canUpgrade(20)).toBe(false)
  })
})

import { Library } from './buildings/library'
import { BuildingTypes } from './buildings/enum'
import { ResourceTypes } from './resource'
import { isExtractionOrProductionBuilding } from './buildings'

describe('Library building', () => {
  it('has the LIBRARY type and stacks via count', () => {
    expect(new Library(1).getType()).toBe(BuildingTypes.LIBRARY)
    expect(new Library(3).count).toBe(3)
  })
  it('requires 2 Érudits, costs 15 WOOD + 10 STONE, 4 months, 2 builders, outputs 2 research', () => {
    expect(Library.timeToBuild).toBe(4)
    expect(Library.researchOutput).toBe(2)
    expect(Library.constructionCosts).toEqual([
      { resource: ResourceTypes.WOOD, amount: 15 },
      { resource: ResourceTypes.STONE, amount: 10 },
    ])
    expect(new Library(1).workerTypeRequired).toEqual([{ occupation: OccupationTypes.ERUDIT, count: 2 }])
  })
  it('counts as a production building (so worker space is computed)', () => {
    expect(isExtractionOrProductionBuilding(new Library(1))).toBe(true)
  })
})

import { Civilization } from './civilization'
import { Library as Lib } from './buildings/library'
import { People } from './people/people'
import { Gender } from './people/enum'

const addErudits = (civ: Civilization, n: number) => {
  for (let i = 0; i < n; i++) {
    const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    p.id = `e-${i}`
    p.setOccupation(OccupationTypes.ERUDIT)
    civ.addPeople(p)
  }
}

describe('research production', () => {
  it('credits researchOutput points for a fully staffed library', () => {
    const civ = new Civilization('Academy')
    civ.addBuilding(new Lib(1))
    addErudits(civ, 2)
    civ['produceResearch']()
    expect(civ.researchPoints).toBe(2)
  })
  it('scales with partial staffing (1 of 2 érudits → 1 point)', () => {
    const civ = new Civilization('Academy')
    civ.addBuilding(new Lib(1))
    addErudits(civ, 1)
    civ['produceResearch']()
    expect(civ.researchPoints).toBe(1)
  })
  it('produces nothing without a library', () => {
    const civ = new Civilization('NoLib')
    addErudits(civ, 2)
    civ['produceResearch']()
    expect(civ.researchPoints).toBe(0)
  })
  it('stacks: 2 libraries with 4 érudits → 4 points', () => {
    const civ = new Civilization('BigAcademy')
    civ.addBuilding(new Lib(2))
    addErudits(civ, 4)
    civ['produceResearch']()
    expect(civ.researchPoints).toBe(4)
  })
})
