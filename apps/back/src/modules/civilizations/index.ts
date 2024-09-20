import { CivilizationBuilder, Gender, OccupationTypes, People, Resource, ResourceTypes, formatCivilizations } from '@ajustor/simulation'
import Elysia, { error, t } from 'elysia'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

import { CivilizationTable } from './database'
import { authorization } from '../../libs/handlers/authorization'
import { jwtMiddleware } from '../../libs/jwt'
import { logger } from '@bogeychan/elysia-logger'

const INITIAL_CITIZEN_NUMBER = 6
const INITIAL_CITIZEN_AGE = 12 * 16
const INITIAL_CITIZEN_LIFE = 3
const INITIAL_OCCUPATION_CHOICE = [OccupationTypes.CARPENTER, OccupationTypes.FARMER]
const INITIAL_CIVILIZATION_RESOURCES = {
  FOOD: 20,
  WOOD: 0,
  STONE: 0,
}

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationDbClient: new CivilizationTable() })
  .get('', async ({ civilizationDbClient, log }) => {
    const civilizations = await civilizationDbClient.getAll()
    return { count: civilizations.length, civilizations: formatCivilizations(civilizations) }
  })
  .use(authorization('Actions on civilization require auth'))
  .get('/mine', async ({ user, civilizationDbClient }) => {
    const civilizations = await civilizationDbClient.getByUserId(user.id)
    return { count: civilizations.length, civilizations: formatCivilizations(civilizations) }
  })
  .get('/:civilizationId', async ({ user, civilizationDbClient, params: { civilizationId } }) => {
    const civilization = await civilizationDbClient.getByUserAndCivilizationId(user.id, civilizationId)
    if (!civilization) {
      return { civilization: undefined }
    }
    return { civilization: formatCivilizations([civilization])[0] }
  })
  .post('', async ({ civilizationDbClient, body, log, user }) => {

    const civilizationWithThatNameExist = await civilizationDbClient.exist(body.name)
    if (civilizationWithThatNameExist) {
      log.error('Conflict a civilization with that name already exist')
      throw error(409, 'A civilization with that name already exist')
    }

    const civilizationBuilder = new CivilizationBuilder()

    const people = Array.from(Array(INITIAL_CITIZEN_NUMBER)).map((_, idx) => {
      const person = new People({
        name: uniqueNamesGenerator({ dictionaries: [names] }),
        month: INITIAL_CITIZEN_AGE,
        gender: idx % 2 === 0 ? Gender.FEMALE : Gender.MALE,
        lifeCounter: INITIAL_CITIZEN_LIFE
      })

      person.setOccupation(INITIAL_OCCUPATION_CHOICE[Math.floor(Math.random() * INITIAL_OCCUPATION_CHOICE.length)])

      return person
    })

    civilizationBuilder
      .withName(body.name)
      .addResource(
        new Resource(ResourceTypes.FOOD, INITIAL_CIVILIZATION_RESOURCES.FOOD),
        new Resource(ResourceTypes.WOOD, INITIAL_CIVILIZATION_RESOURCES.WOOD),
        new Resource(ResourceTypes.STONE, INITIAL_CIVILIZATION_RESOURCES.STONE)
      )
      .addCitizen(...people)

    await civilizationDbClient.create(user.id as string, civilizationBuilder.build())
  }, {
    body: t.Object({
      name: t.String({ minLength: 3 })
    })
  })
  .delete('/:civilizationId', async ({ civilizationDbClient, params: { civilizationId }, user }) => {
    await civilizationDbClient.delete(user.id as string, civilizationId)
  })
