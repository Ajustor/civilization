import { People } from './people'
import { Gender } from './enum'
import { OccupationTypes } from './work/enum'

describe('Soldier occupation', () => {
  it('can be assigned and reports the SOLDIER occupation type', () => {
    const person = new People({ month: 12 * 25, gender: Gender.MALE, lifeCounter: 8 })
    person.setOccupation(OccupationTypes.SOLDIER)
    expect(person.work?.occupationType).toBe(OccupationTypes.SOLDIER)
  })

  it('has a defined eat factor (not NaN) when a soldier eats', () => {
    const person = new People({ month: 12 * 25, gender: Gender.MALE, lifeCounter: 8 })
    person.setOccupation(OccupationTypes.SOLDIER)
    expect(Number.isNaN(person.eatFactor)).toBe(false)
    expect(person.eatFactor).toBeGreaterThan(0)
  })
})
