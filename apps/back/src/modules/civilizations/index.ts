import Elysia, { t } from 'elysia'
import { CivilizationTable } from './database'
import { db } from '../../libs/database'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'
import { CivilizationBuilder } from '../../simulation/builders/civilizationBuilder'
import { Citizen } from '../../simulation/citizen/citizen'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import { ProfessionType } from '../../simulation/citizen/work/enum'
import { Resource, ResourceType } from '../../simulation/resource'

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationDbClient: new CivilizationTable(db) })
  .get('', async ({ civilizationDbClient, log }) => {
    const civilizations = await civilizationDbClient.getAll()
    return civilizations
  })
  .post('', async ({ civilizationDbClient, jwt, cookie: { auth }, set, body, log }) => {
    const user = await jwt.verify(auth.value)
    if (!user) {
      set.status = 403
      throw new Error('You need to connect to create a civilization')
    }
    const civilizationBuilder = new CivilizationBuilder()
    const firstCitizen = new Citizen(uniqueNamesGenerator({ dictionaries: [names] }), 10, 3)
    const secondCitizen = new Citizen(uniqueNamesGenerator({ dictionaries: [names] }), 10, 3)

    firstCitizen.setProfession(ProfessionType.FARMER)
    secondCitizen.setProfession(ProfessionType.CARPENTER)

    civilizationBuilder
      .withName(body.name)
      .addResource(new Resource(ResourceType.FOOD, 10), new Resource(ResourceType.WOOD, 0))
      .addCitizen(firstCitizen, secondCitizen)

    log.info('On va aller créer la civilisation dans la bdd')

    await civilizationDbClient.create(user.id as string, civilizationBuilder.build())
  }, {
    body: t.Object({
      name: t.String({ minLength: 3 })
    })
  })
