import { TECH_TREE, TechId, getTechNode, getBuildingGate } from './techTree'
import { BuildingTypes } from '../buildings/enum'

describe('TECH_TREE', () => {
  it('exposes all nodes with valid ids', () => {
    expect(TECH_TREE.length).toBeGreaterThanOrEqual(14)
    expect(getTechNode(TechId.CRAFTSMANSHIP)?.cost).toBe(45)
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
  it('gates SAWMILL, KILN, MINE, WALL, HOUSE and WAREHOUSE', () => {
    expect(getBuildingGate(BuildingTypes.SAWMILL)).toBe(TechId.CRAFTSMANSHIP)
    expect(getBuildingGate(BuildingTypes.KILN)).toBe(TechId.CRAFTSMANSHIP)
    expect(getBuildingGate(BuildingTypes.MINE)).toBe(TechId.MASONRY)
    expect(getBuildingGate(BuildingTypes.WALL)).toBe(TechId.MASONRY)
    // La Maison est l'évolution de la Tente, gardée par la recherche Construction.
    expect(getBuildingGate(BuildingTypes.HOUSE)).toBe(TechId.CONSTRUCTION)
    // L'Entrepôt est l'évolution de la Cache, gardé par Entreposage.
    expect(getBuildingGate(BuildingTypes.WAREHOUSE)).toBe(TechId.WAREHOUSING)
    expect(getBuildingGate(BuildingTypes.TENT)).toBeUndefined()
    expect(getBuildingGate(BuildingTypes.CACHE)).toBeUndefined()
    expect(getBuildingGate(BuildingTypes.LIBRARY)).toBeUndefined()
  })
})
