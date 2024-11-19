import { ActionInput, WorldEvent } from './interface'
import { MAX_LIFE, MINIMUM_CONCEPTION_AGE, People } from '../people/people'
import { getRandomInt, isWithinChance } from '../utils/random'

import { Events } from './enum'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'
import { PeopleBuilder } from '../builders'
import { ResourceTypes } from '../resource'

const MINIMUM_POPULATION_THRESHOLD = 100
const MAXIMUM_INCOMING_PEOPLE_RATE = 10
const MAXIMUM_OUTGOING_PEOPLE_RATE = 13

export class Migration implements WorldEvent {
  type = Events.MIGRATION

  actions({ world, civilizations }: Required<ActionInput>): void {
    const movingPeopleWorldwide = []
    const civilizationReceptionCapacity: {
      attractiveness: number
      incomingPeopleCount: number
      id: string
    }[] = []

    for (const civilization of civilizations) {
      if (civilization.people.length < MINIMUM_POPULATION_THRESHOLD) {
        continue
      }

      let leavingPeople: People[] = []
      const OUTGOING_PEOPLE_RATE = getRandomInt(0, MAXIMUM_OUTGOING_PEOPLE_RATE)
      const INCOMING_PEOPLE_RATE = getRandomInt(0, MAXIMUM_INCOMING_PEOPLE_RATE)

      const citizens = civilization.people.toSorted(() => Math.random() - 0.5)

      let leavingPeopleCount = ~~(
        citizens.length *
        (OUTGOING_PEOPLE_RATE / 100)
      )

      for (const citizen of citizens) {
        if (!leavingPeopleCount) {
          break
        }

        const willMigrate = isWithinChance(50)

        if (!willMigrate) {
          leavingPeople.push(citizen)
          leavingPeopleCount--
        }
      }

      civilization.removePeople(leavingPeople.map(({ id }) => id))

      for (const people of leavingPeople) {
        movingPeopleWorldwide.push(people)
      }

      civilizationReceptionCapacity.push({
        incomingPeopleCount: this.computeIncomingPeopleCount(
          civilization.citizensCount,
          INCOMING_PEOPLE_RATE,
        ),
        attractiveness: this.computeAttractiveness(
          civilization.citizensCount,
          civilization.getResource(ResourceTypes.RAW_FOOD).quantity,
          civilization.getResource(ResourceTypes.COOKED_FOOD).quantity,
        ),
        id: civilization.id,
      })
    }

    civilizationReceptionCapacity.sort(
      (
        { attractiveness: attractivenessA },
        { attractiveness: attractivenessB },
      ) => attractivenessB - attractivenessA,
    )

    for (const receptionCapacity of civilizationReceptionCapacity) {
      let { incomingPeopleCount } = receptionCapacity

      const civilization = world.getCivilization(receptionCapacity.id)
      if (!civilization) {
        continue
      }

      const incomingCitizens: People[] = []
      while (incomingPeopleCount > 0 && movingPeopleWorldwide.length) {
        const [incomingCitizen] = movingPeopleWorldwide.splice(0, 1)
        incomingCitizens.push(incomingCitizen)
        incomingPeopleCount--
      }

      for (const incomingCitizen of incomingCitizens) {
        civilization.addPeople(incomingCitizen)
      }
    }
  }

  computeIncomingPeopleCount = (
    citizensCount: number,
    incomingPeopleRate: number,
  ): number => ~~(citizensCount * (incomingPeopleRate / 100))

  computeAttractiveness = (
    citizensCount: number,
    rawFoodQuantity: number,
    cookedFoodQuantity: number,
  ): number => (rawFoodQuantity + cookedFoodQuantity * 2) / citizensCount
}
