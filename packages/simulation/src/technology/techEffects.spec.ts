import { Civilization } from '../civilization'
import { TechId } from './techTree'
import { BuildingTypes } from '../buildings/enum'
import { People } from '../people/people'
import { Gender } from '../people/enum'
import { Resource, ResourceTypes } from '../resource'
import { OccupationTypes } from '../people/work/enum'
import { Farm } from '../buildings/farm'
import { Cache } from '../buildings/cache'

const withTechs = (...techs: TechId[]) => {
  const civ = new Civilization('Techs')
  civ.researchedTechs = techs
  return civ
}

describe('civilization tech aggregates', () => {
  it('gated buildings are locked until their tech is researched', () => {
    const civ = withTechs()
    expect(civ.isBuildingUnlocked(BuildingTypes.SAWMILL)).toBe(false)
    expect(civ.isBuildingUnlocked(BuildingTypes.HOUSE)).toBe(true)
    expect(withTechs(TechId.CRAFTSMANSHIP).isBuildingUnlocked(BuildingTypes.SAWMILL)).toBe(true)
  })
  it('multiplies production factors and sums bonuses', () => {
    const civ = withTechs(TechId.AGRONOMY, TechId.MECHANIZATION, TechId.MEDICINE)
    expect(civ.productionMultiplier).toBeCloseTo(1.15 * 1.25)
    expect(civ.maxChildrenBonus).toBe(5)
    expect(civ.pregnancyProbabilityBonus).toBe(10)
  })
  it('defaults are neutral with no techs', () => {
    const civ = withTechs()
    expect(civ.productionMultiplier).toBe(1)
    expect(civ.storageMultiplier).toBe(1)
    expect(civ.militaryMultiplier).toBe(1)
    expect(civ.maxChildrenBonus).toBe(0)
  })
  it('canUnlock respects prerequisites and already-owned', () => {
    expect(withTechs().canUnlock(TechId.CRAFTSMANSHIP)).toBe(true)
    expect(withTechs().canUnlock(TechId.MASONRY)).toBe(false) // needs CRAFTSMANSHIP
    expect(withTechs(TechId.CRAFTSMANSHIP).canUnlock(TechId.MASONRY)).toBe(true)
    expect(withTechs(TechId.CRAFTSMANSHIP).canUnlock(TechId.CRAFTSMANSHIP)).toBe(false) // already owned
  })
})

describe('building gating', () => {
  it('does not build a gated building (Kiln) without its tech, even if chosen', () => {
    const civ = new Civilization('Locked')
    civ.config = { ...civ.config, NEXT_BUILDING_TO_BUILD: BuildingTypes.KILN }
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    for (let i = 0; i < 5; i++) {
      const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
      p.id = `w-${i}`
      p.setOccupation(OccupationTypes.WOODCUTTER)
      civ.addPeople(p)
    }
    civ['buildNewBuilding']()
    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.KILN)).toBe(false)
  })
  it('builds the gated building once its tech is researched', () => {
    const civ = new Civilization('Unlocked')
    civ.researchedTechs = [TechId.CRAFTSMANSHIP]
    civ.config = { ...civ.config, NEXT_BUILDING_TO_BUILD: BuildingTypes.KILN }
    civ.addResource(new Resource(ResourceTypes.STONE, 1000))
    for (let i = 0; i < 5; i++) {
      const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
      p.id = `w-${i}`
      p.setOccupation(OccupationTypes.WOODCUTTER)
      civ.addPeople(p)
    }
    civ['buildChosenBuilding']()
    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.KILN)).toBe(true)
  })
})

describe('economy effects', () => {
  it('production multiplier increases farm output', () => {
    const base = new Civilization('Base')
    const boosted = new Civilization('Boosted')
    boosted.researchedTechs = [TechId.AGRONOMY] // +15%
    for (const civ of [base, boosted]) {
      civ.addBuilding(new Farm(1))
      for (let i = 0; i < 5; i++) {
        const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
        p.id = `${civ.name}-f-${i}`
        p.setOccupation(OccupationTypes.FARMER)
        civ.addPeople(p)
      }
      civ['produceResources']()
    }
    const baseFood = base.getResource(ResourceTypes.RAW_FOOD).quantity
    const boostedFood = boosted.getResource(ResourceTypes.RAW_FOOD).quantity
    expect(boostedFood).toBeGreaterThan(baseFood)
  })
  it('storage capacity scales with storageMultiplier', () => {
    const civ = new Civilization('Store')
    civ.addBuilding(new Cache())
    const baseCap = civ.getStorageCapacity(ResourceTypes.WOOD)
    civ.researchedTechs = [TechId.WAREHOUSING] // +50%
    expect(civ.getStorageCapacity(ResourceTypes.WOOD)).toBe(Math.floor(baseCap * 1.5))
  })
})
