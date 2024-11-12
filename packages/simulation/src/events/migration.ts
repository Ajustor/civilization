import { ActionInput, WorldEvent } from './interface'
import { MAX_LIFE, MINIMUM_CONCEPTION_AGE } from '../people/people'
import { getRandomInt, isWithinChance } from '../utils/random'

import { Events } from './enum'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'
import { PeopleBuilder } from '../builders'

const MAXIMUM_INCOMING_PEOPLE_RATE = 10
const MAXIMUM_OUTGOING_PEOPLE_RATE = 13

export class Migration implements WorldEvent {
  type = Events.MIGRATION

  actions({
    civilizations,
  }: Required<Pick<ActionInput, 'civilizations'>>): void {
    for (const civilization of civilizations) {
      
      if(civilization.people.length < 100) {
        continue
      } 

      const INCOMING_PEOPLE_RATE = getRandomInt(0, MAXIMUM_INCOMING_PEOPLE_RATE)
      const OUTGOING_PEOPLE_RATE = getRandomInt(0, MAXIMUM_OUTGOING_PEOPLE_RATE)

      const adults = civilization
        .getPeopleOlderThan(MINIMUM_CONCEPTION_AGE)
        .toSorted(() => Math.random() - 0.5)

      let leavingPeopleCount = ~~(adults.length * (OUTGOING_PEOPLE_RATE / 100))

      const leavingPeopleIds = adults.reduce<string[]>((acc, citizen) => {
        if (!leavingPeopleCount) {
          return acc
        }

        const willMigrate = isWithinChance(50)

        if (!willMigrate) {
          return acc
        }

        leavingPeopleCount--
        return [...acc, citizen.id]
      }, [])

      civilization.removePeople(leavingPeopleIds)

      const incomingPeopleCount = ~~(
        civilization.citizensCount *
        (INCOMING_PEOPLE_RATE / 100)
      )
      const genders = [Gender.MALE, Gender.FEMALE]
      const occupations = [OccupationTypes.GATHERER, OccupationTypes.WOODCUTTER]

      const incomingPeople = Array.from({ length: incomingPeopleCount }, () =>
        new PeopleBuilder()
          .withGender(genders[getRandomInt(0, 1)])
          .withOccupation(occupations[getRandomInt(0, 1)])
          .withMonth(getRandomInt(12, 45) * 12)
          .withLifeCounter(getRandomInt(6, MAX_LIFE))
          .build(),
      )

      civilization.addPeople(...incomingPeople)
    }
  }
}
