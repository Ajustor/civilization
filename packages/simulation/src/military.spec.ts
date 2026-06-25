import { Civilization } from './civilization'
import { People } from './people/people'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'

const adultGatherers = (civ: Civilization, count: number) => {
  for (let i = 0; i < count; i++) {
    const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
    p.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(p)
  }
}

describe('soldier recruitment', () => {
  it('recruits up to MILITARY_RATIO percent of adults as soldiers', () => {
    const civ = new Civilization('Army')
    civ.config = { ...civ.config, MILITARY_RATIO: 50 }
    adultGatherers(civ, 10)

    civ.adaptPeopleJob()

    const soldiers = civ.getPeopleWithOccupation(OccupationTypes.SOLDIER).length
    expect(soldiers).toBe(5)
  })

  it('recruits nobody when MILITARY_RATIO is 0', () => {
    const civ = new Civilization('Pacifist')
    adultGatherers(civ, 10)
    civ.adaptPeopleJob()
    expect(civ.getPeopleWithOccupation(OccupationTypes.SOLDIER).length).toBe(0)
  })
})
