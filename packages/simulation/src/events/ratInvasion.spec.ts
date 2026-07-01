import { Civilization } from '../civilization'
import { Cache } from '../buildings/cache'
import { Resource, ResourceTypes } from '../resource'
import { TechId } from '../technology/techTree'
import { RatInvasion } from './ratInvasion'

const makeCiv = (techs: TechId[] = []): Civilization => {
  const civ = new Civilization('civ')
  civ.researchedTechs = techs
  civ.addBuilding(new Cache()) // protects some RAW_FOOD (storage capacity)
  civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 1000))
  return civ
}

const runRatInvasion = (civ: Civilization) =>
  new RatInvasion().actions({ civilizations: [civ], world: undefined as never })

describe('RatInvasion', () => {
  it('destroys the food beyond storage capacity (food decreases, never increases)', () => {
    const civ = makeCiv()

    runRatInvasion(civ)

    const after = civ.getResource(ResourceTypes.RAW_FOOD).quantity
    expect(after).toBeLessThan(1000) // food was raided, not magically increased
    expect(after).toBeGreaterThanOrEqual(0)
  })

  it('applies PEST_CONTROL: less food is lost than without the tech', () => {
    const withoutTech = makeCiv()
    const withTech = makeCiv([TechId.PEST_CONTROL])

    runRatInvasion(withoutTech)
    runRatInvasion(withTech)

    expect(withTech.getResource(ResourceTypes.RAW_FOOD).quantity).toBeGreaterThan(
      withoutTech.getResource(ResourceTypes.RAW_FOOD).quantity,
    )
  })
})
