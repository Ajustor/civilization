import { Civilization } from '../civilization'
import { TechId } from './techTree'
import { BuildingTypes } from '../buildings/enum'
import { People, MAX_NUMBER_OF_CHILD } from '../people/people'
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

describe('military and population effects', () => {
  it('military strength scales with militaryMultiplier', () => {
    const civ = new Civilization('Army')
    const soldier = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    soldier.id = 'sold'
    soldier.setOccupation(OccupationTypes.SOLDIER)
    civ.addPeople(soldier)
    const base = civ.militaryStrength
    civ.researchedTechs = [TechId.MASONRY, TechId.METALLURGY] // +25%
    expect(civ.militaryStrength).toBe(Math.floor(base * 1.25))
  })
  it('armory stacks on top of metallurgy for +87.5% total', () => {
    const civ = new Civilization('Army2')
    const soldier = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    soldier.id = 'sold2'
    soldier.setOccupation(OccupationTypes.SOLDIER)
    civ.addPeople(soldier)
    const base = civ.militaryStrength
    civ.researchedTechs = [TechId.MASONRY, TechId.METALLURGY, TechId.ARMORY]
    expect(civ.militaryStrength).toBe(Math.floor(base * 1.25 * 1.5))
  })
  it('medicine raises the per-woman child limit by 5', () => {
    const civ = new Civilization('Pop')
    expect(civ.effectiveMaxChildrenPerWoman).toBe(MAX_NUMBER_OF_CHILD)
    civ.researchedTechs = [TechId.MEDICINE] // +5
    expect(civ.effectiveMaxChildrenPerWoman).toBe(MAX_NUMBER_OF_CHILD + 5)
    expect(civ.effectivePregnancyProbability).toBe(Math.min(100, civ.config.PREGNANCY_PROBABILITY + 10))
  })
  it('demography stacks on medicine for +8 children total', () => {
    const civ = new Civilization('Pop2')
    civ.researchedTechs = [TechId.MEDICINE, TechId.DEMOGRAPHY]
    expect(civ.effectiveMaxChildrenPerWoman).toBe(MAX_NUMBER_OF_CHILD + 5 + 3)
    expect(civ.effectivePregnancyProbability).toBe(Math.min(100, civ.config.PREGNANCY_PROBABILITY + 10 + 15))
  })
  it('a woman past the base limit can still conceive with the medicine bonus', () => {
    const woman = new People({ month: 25 * 12, gender: Gender.FEMALE, lifeCounter: 10 })
    woman.numberOfChild = MAX_NUMBER_OF_CHILD + 1 // 4 children: beyond the base cap of 3
    expect(woman.canConceive()).toBe(false)
    expect(woman.canConceive(MAX_NUMBER_OF_CHILD + 5)).toBe(true)
  })
})

describe('research multiplier effects', () => {
  it('defaults to 1 with no techs', () => {
    expect(withTechs().researchMultiplier).toBe(1)
  })
  it('philosophy gives ×1.25 research multiplier', () => {
    expect(withTechs(TechId.PHILOSOPHY).researchMultiplier).toBeCloseTo(1.25)
  })
  it('philosophy + sciences stack multiplicatively to ×1.875', () => {
    expect(withTechs(TechId.PHILOSOPHY, TechId.SCIENCES).researchMultiplier).toBeCloseTo(1.25 * 1.5)
  })
  it('sciences requires philosophy as prerequisite', () => {
    expect(withTechs().canUnlock(TechId.SCIENCES)).toBe(false)
    expect(withTechs(TechId.PHILOSOPHY).canUnlock(TechId.SCIENCES)).toBe(true)
  })
})

describe('new prerequisite chains', () => {
  it('irrigation requires agronomy', () => {
    expect(withTechs().canUnlock(TechId.IRRIGATION)).toBe(false)
    expect(withTechs(TechId.AGRONOMY).canUnlock(TechId.IRRIGATION)).toBe(true)
  })
  it('logistics requires warehousing', () => {
    expect(withTechs().canUnlock(TechId.LOGISTICS)).toBe(false)
    expect(withTechs(TechId.WAREHOUSING).canUnlock(TechId.LOGISTICS)).toBe(true)
  })
  it('engineering requires masonry AND mechanization', () => {
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY).canUnlock(TechId.ENGINEERING)).toBe(false)
    expect(withTechs(TechId.AGRONOMY, TechId.MECHANIZATION).canUnlock(TechId.ENGINEERING)).toBe(false)
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.AGRONOMY, TechId.MECHANIZATION).canUnlock(TechId.ENGINEERING)).toBe(true)
  })
  it('irrigation and mechanization stack multiplicatively', () => {
    const civ = withTechs(TechId.AGRONOMY, TechId.IRRIGATION, TechId.MECHANIZATION)
    expect(civ.productionMultiplier).toBeCloseTo(1.15 * 1.20 * 1.25)
  })
  it('logistics stacks on warehousing', () => {
    const civ = withTechs(TechId.WAREHOUSING, TechId.LOGISTICS)
    expect(civ.storageMultiplier).toBeCloseTo(1.5 * 1.75)
  })
})

describe('tier-4 techs', () => {
  it('alchemy requires metallurgy AND medicine', () => {
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.METALLURGY).canUnlock(TechId.ALCHEMY)).toBe(false)
    expect(withTechs(TechId.MEDICINE).canUnlock(TechId.ALCHEMY)).toBe(false)
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.METALLURGY, TechId.MEDICINE).canUnlock(TechId.ALCHEMY)).toBe(true)
  })
  it('alchemy adds production multiplier and pregnancy bonus', () => {
    const civ = withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.METALLURGY, TechId.MEDICINE, TechId.ALCHEMY)
    expect(civ.productionMultiplier).toBeCloseTo(1.20)
    expect(civ.pregnancyProbabilityBonus).toBe(10 + 5)
  })
  it('hydraulics requires irrigation AND masonry', () => {
    expect(withTechs(TechId.AGRONOMY, TechId.IRRIGATION).canUnlock(TechId.HYDRAULICS)).toBe(false)
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY).canUnlock(TechId.HYDRAULICS)).toBe(false)
    expect(withTechs(TechId.AGRONOMY, TechId.IRRIGATION, TechId.CRAFTSMANSHIP, TechId.MASONRY).canUnlock(TechId.HYDRAULICS)).toBe(true)
  })
  it('hydraulics adds storage and production multipliers', () => {
    const civ = withTechs(TechId.AGRONOMY, TechId.IRRIGATION, TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.HYDRAULICS)
    expect(civ.storageMultiplier).toBeCloseTo(1.30)
    expect(civ.productionMultiplier).toBeCloseTo(1.15 * 1.20 * 1.15)
  })
  it('astronomy requires sciences', () => {
    expect(withTechs(TechId.PHILOSOPHY).canUnlock(TechId.ASTRONOMY)).toBe(false)
    expect(withTechs(TechId.PHILOSOPHY, TechId.SCIENCES).canUnlock(TechId.ASTRONOMY)).toBe(true)
  })
  it('astronomy stacks on philosophy and sciences for ×3.75 total research', () => {
    const civ = withTechs(TechId.PHILOSOPHY, TechId.SCIENCES, TechId.ASTRONOMY)
    expect(civ.researchMultiplier).toBeCloseTo(1.25 * 1.5 * 2.0)
  })
  it('urbanism requires engineering', () => {
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.AGRONOMY, TechId.MECHANIZATION).canUnlock(TechId.URBANISM)).toBe(false)
    expect(withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.AGRONOMY, TechId.MECHANIZATION, TechId.ENGINEERING).canUnlock(TechId.URBANISM)).toBe(true)
  })
  it('urbanism adds children and pregnancy bonus', () => {
    const civ = withTechs(TechId.CRAFTSMANSHIP, TechId.MASONRY, TechId.AGRONOMY, TechId.MECHANIZATION, TechId.ENGINEERING, TechId.URBANISM)
    expect(civ.maxChildrenBonus).toBe(4)
    expect(civ.pregnancyProbabilityBonus).toBe(10)
  })
  it('commerce requires logistics', () => {
    expect(withTechs(TechId.WAREHOUSING).canUnlock(TechId.COMMERCE)).toBe(false)
    expect(withTechs(TechId.WAREHOUSING, TechId.LOGISTICS).canUnlock(TechId.COMMERCE)).toBe(true)
  })
  it('commerce stacks on warehousing and logistics', () => {
    const civ = withTechs(TechId.WAREHOUSING, TechId.LOGISTICS, TechId.COMMERCE)
    expect(civ.storageMultiplier).toBeCloseTo(1.5 * 1.75 * 1.50)
  })
})
