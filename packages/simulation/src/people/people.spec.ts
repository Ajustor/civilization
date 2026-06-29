const isWithinChance = jest.fn()

jest.mock('../utils', () => ({ isWithinChance }))

import { LIFE_EXPECTANCY, People } from './people'

import { Gender } from './enum'
import { OccupationTypes } from './work/enum'

describe('People', () => {

  describe('isAlive', () => {
    it('Should return FALSE because the citizen has no health left', () => {
      const bob = new People({ month: (LIFE_EXPECTANCY * 12) - 20, gender: Gender.FEMALE, lifeCounter: 0 })
      expect(bob.isAlive()).toBeFalsy()
    })

    it('Should return TRUE because the citizen is healthy and is under LIFE_EXPECTANCY', () => {
      const bob = new People({ month: (LIFE_EXPECTANCY * 12) - 20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeTruthy()
    })

    it('Should return FALSE because the citizen is healthy and is over LIFE_EXPECTANCY and isWithinChance(DEATH_RATE) is true', () => {
      isWithinChance.mockReturnValue(true)
      const bob = new People({ month: (LIFE_EXPECTANCY * 12) + 20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeFalsy()
    })

    it('Should return TREU because the citizen is healthy and is over LIFE_EXPECTANCY and isWithinChance(DEATH_RATE) is false', () => {
      isWithinChance.mockReturnValue(false)
      const bob = new People({ month: (LIFE_EXPECTANCY * 12) + 20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeTruthy()
    })
  })

  describe('collectResource', () => {
    // A worker assigned to a construction site must do nothing else: even though
    // they keep a collecting occupation (gatherer), they must not gather while
    // building. Guards the regression where `isBuilding` people still collected.
    it('does not collect resources while building', () => {
      const builder = new People({ month: 25 * 12, gender: Gender.MALE })
      builder.setOccupation(OccupationTypes.GATHERER)
      builder.startBuilding(2)

      // Returns false by short-circuit, before touching the world/civilization.
      expect(builder.collectResource({} as never, {} as never)).toBe(false)
    })

    it('does not collect resources when the person is too old to work', () => {
      const retiree = new People({ month: 80 * 12, gender: Gender.MALE })
      retiree.setOccupation(OccupationTypes.GATHERER)

      expect(retiree.collectResource({} as never, {} as never)).toBe(false)
    })
  })
})