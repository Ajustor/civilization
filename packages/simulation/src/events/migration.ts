import type { ActionInput, WorldEvent } from './interface'
import type { People } from '../people/people'
import type { Civilization } from '../civilization'
import { getRandomInt, shuffle } from '../utils/random'

import { Events } from './enum'
import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import { House } from '../buildings/house'

const MINIMUM_POPULATION_THRESHOLD = 100
const MIN_OUTGOING_PEOPLE_RATE = 0
const MAXIMUM_OUTGOING_PEOPLE_RATE = 13
const MAXIMUM_INCOMING_PEOPLE_RATE = 10

// Efficacité de la garde-frontière : un ratio soldats/population de 1/EFFECTIVENESS
// (soit 25 %) verrouille 100 % des départs ; en dessous, réduction linéaire.
const BORDER_GUARD_EFFECTIVENESS = 4

// Bornes des facteurs « qualité de vie » qui modulent l'attractivité. Centrés sur
// 1 : ils n'ont d'effet qu'en cas de différence entre civs.
const HOUSING_MIN_FACTOR = 0.5
const HOUSING_MAX_FACTOR = 1.5
const AT_WAR_FACTOR = 0.6
const HEALTH_REFERENCE_LIFE = 8 // lifeCounter de référence (max 12)
const HEALTH_MIN_FACTOR = 0.5
const HEALTH_MAX_FACTOR = 1.25

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

type MovingPerson = { person: People; originId: string }

export class Migration implements WorldEvent {
  type = Events.MIGRATION

  actions({ world, civilizations }: Required<ActionInput>): void {
    // Seules les civs assez peuplées participent. On calcule leur attractivité
    // une seule fois, AVANT tout départ, pour piloter le facteur de fuite.
    const eligibleCivilizations = civilizations.filter(
      (civilization) => civilization.people.length >= MINIMUM_POPULATION_THRESHOLD,
    )
    if (!eligibleCivilizations.length) {
      return
    }

    const attractivenessById = new Map<string, number>()
    for (const civilization of eligibleCivilizations) {
      attractivenessById.set(civilization.id, this.computeAttractiveness(civilization))
    }
    const averageAttractiveness =
      [...attractivenessById.values()].reduce((sum, value) => sum + value, 0) /
      attractivenessById.size

    const movingPeopleWorldwide: MovingPerson[] = []
    const civilizationReceptionCapacity: {
      attractiveness: number
      incomingPeopleCount: number
      id: string
    }[] = []

    for (const civilization of eligibleCivilizations) {
      const attractiveness = attractivenessById.get(civilization.id) ?? 0
      const population = civilization.people.length

      // Facteur de fuite : plus la civ est sous la moyenne, plus on en part.
      const pressure =
        averageAttractiveness > 0
          ? clamp((averageAttractiveness - attractiveness) / averageAttractiveness, 0, 1)
          : 0
      const outgoingRate =
        MIN_OUTGOING_PEOPLE_RATE +
        (MAXIMUM_OUTGOING_PEOPLE_RATE - MIN_OUTGOING_PEOPLE_RATE) * pressure

      let leavingPeopleCount = ~~((population * outgoingRate) / 100)

      // Soldats gardes-frontières : ils retiennent une partie des partants.
      const soldiers = civilization.getPeopleWithOccupation(
        OccupationTypes.SOLDIER,
      ).length
      const retention = this.computeBorderRetention(soldiers, population)
      leavingPeopleCount = ~~(leavingPeopleCount * (1 - retention))

      const leavingPeople = shuffle(civilization.people).slice(0, leavingPeopleCount)
      civilization.removePeople(leavingPeople.map(({ id }) => id))
      for (const person of leavingPeople) {
        movingPeopleWorldwide.push({ person, originId: civilization.id })
      }

      const incomingPeopleRate = getRandomInt(0, MAXIMUM_INCOMING_PEOPLE_RATE)
      civilizationReceptionCapacity.push({
        incomingPeopleCount: this.computeIncomingPeopleCount(
          civilization.citizensCount,
          incomingPeopleRate,
        ),
        attractiveness,
        id: civilization.id,
      })
    }

    // Accueil : les civs les plus attractives se servent en premier dans le pool.
    civilizationReceptionCapacity.sort(
      ({ attractiveness: a }, { attractiveness: b }) => b - a,
    )

    for (const receptionCapacity of civilizationReceptionCapacity) {
      let { incomingPeopleCount } = receptionCapacity
      const civilization = world.getCivilization(receptionCapacity.id)
      if (!civilization) {
        continue
      }
      while (incomingPeopleCount > 0 && movingPeopleWorldwide.length) {
        const [incoming] = movingPeopleWorldwide.splice(0, 1)
        civilization.addPeople(incoming.person)
        incomingPeopleCount--
      }
    }

    // Zéro perte silencieuse : les migrants non placés rentrent dans leur civ
    // d'origine plutôt que de disparaître du monde.
    for (const { person, originId } of movingPeopleWorldwide) {
      world.getCivilization(originId)?.addPeople(person)
    }
  }

  computeBorderRetention = (soldiers: number, population: number): number => {
    if (population <= 0) {
      return 0
    }
    return Math.min(1, (soldiers / population) * BORDER_GUARD_EFFECTIVENESS)
  }

  computeIncomingPeopleCount = (
    citizensCount: number,
    incomingPeopleRate: number,
  ): number => ~~(citizensCount * (incomingPeopleRate / 100))

  // Attractivité = nourriture/habitant (moteur principal) modulée par des facteurs
  // qualité de vie (logement, paix, santé) centrés sur 1.
  computeAttractiveness = (civilization: Civilization): number => {
    const population = Math.max(1, civilization.people.length)
    const rawFood = civilization.getResource(ResourceTypes.RAW_FOOD).quantity
    const cookedFood = civilization.getResource(ResourceTypes.COOKED_FOOD).quantity
    const base = (rawFood + cookedFood * 2) / population

    const housingCapacity = (civilization.houses?.count ?? 0) * House.capacity
    const housingFactor = clamp(
      housingCapacity / population,
      HOUSING_MIN_FACTOR,
      HOUSING_MAX_FACTOR,
    )

    const safetyFactor =
      civilization.config.AT_WAR_WITH.length > 0 ? AT_WAR_FACTOR : 1

    const averageLife =
      civilization.people.reduce((sum, person) => sum + person.lifeCounter, 0) /
      population
    const healthFactor = clamp(
      averageLife / HEALTH_REFERENCE_LIFE,
      HEALTH_MIN_FACTOR,
      HEALTH_MAX_FACTOR,
    )

    return base * housingFactor * safetyFactor * healthFactor
  }
}
