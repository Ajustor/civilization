import { Wall } from './wall'
import { BuildingTypes } from './enum'
import { ResourceTypes } from '../resource'

describe('Wall', () => {
  it('is a 12-month, 250-builder unique building costing stone and wood', () => {
    const wall = new Wall(1)
    expect(wall.getType()).toBe(BuildingTypes.WALL)
    expect(Wall.timeToBuild).toBe(12)
    expect(Wall.minBuilders).toBe(250)
    const stone = Wall.constructionCosts.find((c) => c.resource === ResourceTypes.STONE)
    const wood = Wall.constructionCosts.find((c) => c.resource === ResourceTypes.WOOD)
    expect(stone?.amount).toBe(2000)
    expect(wood?.amount).toBe(1500)
  })
})
