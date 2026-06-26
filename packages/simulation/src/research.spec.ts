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
