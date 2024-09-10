import { Citizen, CivilizationBuilder, Gender, OccupationTypes, Resource, ResourceTypes, formatCivilizations } from '@ajustor/simulation'
import Elysia, { error, t } from 'elysia'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

import { CivilizationTable } from './database'
import { authorization } from '../../libs/handlers/authorization'
import { db } from '../../libs/database'
import { jwtMiddleware } from '../../libs/jwt'
import { logger } from '@bogeychan/elysia-logger'

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationDbClient: new CivilizationTable(db) })
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
    return { civilization: formatCivilizations([civilization])[0] }
  })
  .post('', async ({ civilizationDbClient, body, log, user }) => {

    const civilizationWithThatNameExist = await civilizationDbClient.exist(body.name)
    if (civilizationWithThatNameExist) {
      log.error('Conflict a civilization with that name already exist')
      throw error(409, 'A civilization with that name already exist')
    }

    const civilizationBuilder = new CivilizationBuilder()
    const firstCitizen = new Citizen(uniqueNamesGenerator({ dictionaries: [names] }), 120, Gender.FEMALE, 3)
    const secondCitizen = new Citizen(uniqueNamesGenerator({ dictionaries: [names] }), 120, Gender.MALE, 3)

    firstCitizen.setOccupation(OccupationTypes.FARMER)
    secondCitizen.setOccupation(OccupationTypes.CARPENTER)

    civilizationBuilder
      .withName(body.name)
      .addResource(new Resource(ResourceTypes.FOOD, 10), new Resource(ResourceTypes.WOOD, 0))
      .addCitizen(firstCitizen, secondCitizen)

    await civilizationDbClient.create(user.id as string, civilizationBuilder.build())
  }, {
    body: t.Object({
      name: t.String({ minLength: 3 })
    })
  })
  .delete('/:civilizationId', async ({ civilizationDbClient, params: { civilizationId }, user }) => {
    await civilizationDbClient.delete(user.id as string, civilizationId)
  })
