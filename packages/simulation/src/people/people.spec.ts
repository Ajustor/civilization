const isWithinChance = jest.fn()

jest.mock('../utils', () => ({ isWithinChance }))

import { LIFE_EXPECTANCY, People } from './people'

import { Gender } from './enum'

describe('People', () => {
  
  describe('isAlive', () => {
    it('Should return FALSE because the citizen has no health left', () => {
      const bob = new People({ name: 'Bob', month: (LIFE_EXPECTANCY * 12) -20, gender: Gender.FEMALE, lifeCounter: 0 })
      expect(bob.isAlive()).toBeFalsy()
    })

    it('Should return TRUE because the citizen is healthy and is under LIFE_EXPECTANCY', () => {
      const bob = new People({ name: 'Bob', month: (LIFE_EXPECTANCY * 12) -20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeTruthy()
    })

    it('Should return FALSE because the citizen is healthy and is over LIFE_EXPECTANCY and isWithinChance(DEATH_RATE) is true', () => {
      isWithinChance.mockReturnValue(true)
      const bob = new People({ name: 'Bob', month: (LIFE_EXPECTANCY * 12) + 20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeFalsy()
    })

    it('Should return TREU because the citizen is healthy and is over LIFE_EXPECTANCY and isWithinChance(DEATH_RATE) is false', () => {
      isWithinChance.mockReturnValue(false)
      const bob = new People({ name: 'Bob', month: (LIFE_EXPECTANCY * 12) + 20, gender: Gender.FEMALE, lifeCounter: 12 })
      expect(bob.isAlive()).toBeTruthy()
    })
  })
})