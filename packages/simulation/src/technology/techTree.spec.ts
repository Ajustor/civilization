import { TECH_TREE, TechId, getTechNode, getBuildingGate } from './techTree'
import { BuildingTypes } from '../buildings/enum'

describe('TECH_TREE', () => {
  it('exposes the 7 v1 nodes', () => {
    expect(TECH_TREE).toHaveLength(7)
    expect(getTechNode(TechId.CRAFTSMANSHIP)?.cost).toBe(5)
  })
  it('has only valid prerequisites (no unknown id, no self-reference)', () => {
    const ids = new Set(TECH_TREE.map((n) => n.id))
    for (const node of TECH_TREE) {
      for (const pre of node.prerequisites) {
        expect(ids.has(pre)).toBe(true)
        expect(pre).not.toBe(node.id)
      }
    }
  })
  it('gates SAWMILL, KILN, MINE, WALL only', () => {
    expect(getBuildingGate(BuildingTypes.SAWMILL)).toBe(TechId.CRAFTSMANSHIP)
    expect(getBuildingGate(BuildingTypes.KILN)).toBe(TechId.CRAFTSMANSHIP)
    expect(getBuildingGate(BuildingTypes.MINE)).toBe(TechId.MASONRY)
    expect(getBuildingGate(BuildingTypes.WALL)).toBe(TechId.MASONRY)
    expect(getBuildingGate(BuildingTypes.HOUSE)).toBeUndefined()
    expect(getBuildingGate(BuildingTypes.LIBRARY)).toBeUndefined()
  })
})
