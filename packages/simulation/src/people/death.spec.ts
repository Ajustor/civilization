import { test, expect } from 'bun:test'
import { People } from './people'
import { Gender } from './enum'
import { DeathCause } from './death'
import { MINIMAL_AGE_TO_BECOME } from './work/ages'
import { OccupationTypes } from './work/enum'

test('decreaseLife tags the blow that actually kills, and does not overwrite', () => {
  const person = new People({ month: 240, gender: Gender.MALE, lifeCounter: 3 })

  person.decreaseLife(1, DeathCause.COLD) // 3 -> 2, survives
  expect(person.deathCause).toBe(null)

  person.decreaseLife(4, DeathCause.STARVATION) // 2 -> -2, killed
  expect(person.deathCause).toBe(DeathCause.STARVATION)

  person.decreaseLife(1, DeathCause.COLD) // already dead, keep first cause
  expect(person.deathCause).toBe(DeathCause.STARVATION)
})

test('origin civilization is preserved through formatToEntity', () => {
  const person = new People({
    month: 240,
    gender: Gender.FEMALE,
    lifeCounter: 5,
    originCivilizationId: 'origin-civ',
  })
  expect(person.originCivilizationId).toBe('origin-civ')
  expect(person.formatToEntity().originCivilizationId).toBe('origin-civ')
})

test('specialised trades keep their declared entry ages', () => {
  expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.MINER]).toBe(25)
  expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.FARMER]).toBe(21)
  expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.SOLDIER]).toBe(18)
  expect(MINIMAL_AGE_TO_BECOME[OccupationTypes.GATHERER]).toBe(12)
})
