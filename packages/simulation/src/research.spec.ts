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
  it('requires 2 Érudits, costs 15 PLANK + 10 STONE, 4 months, 2 builders, outputs 2 research', () => {
    expect(Library.timeToBuild).toBe(4)
    expect(Library.researchOutput).toBe(2)
    expect(Library.constructionCosts).toEqual([
      { resource: ResourceTypes.PLANK, amount: 15 },
      { resource: ResourceTypes.STONE, amount: 10 },
    ])
    expect(new Library(1).workerTypeRequired).toEqual([{ occupation: OccupationTypes.ERUDIT, count: 2 }])
  })
  it('counts as a production building (so worker space is computed)', () => {
    expect(isExtractionOrProductionBuilding(new Library(1))).toBe(true)
  })
})
