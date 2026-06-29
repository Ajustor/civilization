import { MINIMAL_AGE_TO_BECOME, RETIREMENT_AGE_BY_OCCUPATION } from './ages'
import { OccupationTypes } from './enum'
import { Farmer } from './farmer'
import { Carpenter } from './carpenter'
import { WoodCutter } from './woodCutter'
import { CharcoalBurner } from './charcoalBurner'
import { Gatherer } from './gatherer'
import { Miner } from './miner'
import { KitchenAssistant } from './kitchenAssistant'
import { Erudit } from './erudit'
import { Soldier } from './soldier'

describe('RETIREMENT_AGE_BY_OCCUPATION', () => {
  it('expose les âges de retraite attendus', () => {
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.GATHERER]).toBe(70)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.WOODCUTTER]).toBe(60)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.FARMER]).toBe(70)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.MINER]).toBe(50)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.CARPENTER]).toBe(60)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.CHARCOAL_BURNER]).toBe(60)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.KITCHEN_ASSISTANT]).toBe(70)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.ERUDIT]).toBe(80)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.SOLDIER]).toBe(60)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.CHILD]).toBe(0)
    expect(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.RETIRED]).toBe(0)
  })

  it('chaque classe métier lit son âge de retraite depuis la map', () => {
    expect(new Farmer().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.FARMER])
    expect(new Carpenter().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.CARPENTER])
    expect(new Gatherer().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.GATHERER])
    expect(new Miner().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.MINER])
    expect(new KitchenAssistant().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.KITCHEN_ASSISTANT])
    expect(new Erudit().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.ERUDIT])
    expect(new Soldier().RETIREMENT_AGE).toBe(RETIREMENT_AGE_BY_OCCUPATION[OccupationTypes.SOLDIER])
  })

  it('canRetire / canWork restent cohérents avec la map', () => {
    const miner = new Miner()
    expect(miner.canWork(49)).toBe(true)
    expect(miner.canWork(50)).toBe(false)
    expect(miner.canRetire(50)).toBe(true)
  })

  it('conserve les âges d\'entrée existants', () => {
    expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.MINER]).toBe(25)
    expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.GATHERER]).toBe(12)
  })
})
