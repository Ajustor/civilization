import {
  CivilizationBuilder,
  Gender,
  House,
  OccupationTypes,
  People,
  Resource,
  ResourceTypes,
  formatCivilizations,
} from '@ajustor/simulation'
import Elysia, { error, t } from 'elysia'

import { CivilizationService } from './service'
import { authorization } from '../../libs/handlers/authorization'
import { jwtMiddleware } from '../../libs/jwt'
import { logger } from '@bogeychan/elysia-logger'
import { PeopleService } from '../people/service'

const INITIAL_CITIZEN_NUMBER = 6
const INITIAL_CITIZEN_AGE = 12 * 16
const INITIAL_CITIZEN_LIFE = 3
const INITIAL_OCCUPATION_CHOICE = [
  OccupationTypes.WOODCUTTER,
  OccupationTypes.GATHERER,
]
const INITIAL_CIVILIZATION_RESOURCES = {
  FOOD: 100,
  WOOD: 0,
  STONE: 0,
}

const INITIAL_CIVILIZATION_BUILDING = [
  new House(2)
]

const civilizationServiceInstance = new CivilizationService(new PeopleService())

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationService: civilizationServiceInstance })
  .get('', async ({ civilizationService, log }) => {
    const civilizations = await civilizationService.getAll({ people: true })
    return {
      count: civilizations.length,
      civilizations: formatCivilizations(civilizations),
    }
  })
  .use(authorization('Actions on civilization require auth'))
  .get('/mine', async ({ user, civilizationService }) => {
    const civilizations = await civilizationService.getByUserId(user.id, {
      people: false,
    })
    return {
      count: civilizations.length,
      civilizations: formatCivilizations(civilizations),
    }
  })
  .get(
    '/:civilizationId',
    async ({ user, civilizationService, params: { civilizationId } }) => {
      const civilization = await civilizationService.getByUserAndCivilizationId(
        user.id,
        civilizationId,
      )
      if (!civilization) {
        return { civilization: undefined }
      }
      return { civilization: formatCivilizations([civilization])[0] }
    },
  )
  .post(
    '',
    async ({ civilizationService, body, log, user }) => {
      const civilizationWithThatNameExist = await civilizationService.exist(
        body.name,
      )
      if (civilizationWithThatNameExist) {
        log.error('Conflict a civilization with that name already exist')
        throw error(409, 'A civilization with that name already exist')
      }

      const civilizationBuilder = new CivilizationBuilder()

      const people = Array.from(Array(INITIAL_CITIZEN_NUMBER)).map((_, idx) => {
        const person = new People({
          month: INITIAL_CITIZEN_AGE,
          gender: idx % 2 === 0 ? Gender.FEMALE : Gender.MALE,
          lifeCounter: INITIAL_CITIZEN_LIFE,
        })

        person.setOccupation(
          INITIAL_OCCUPATION_CHOICE[
            Math.floor(Math.random() * INITIAL_OCCUPATION_CHOICE.length)
          ],
        )

        return person
      })

      civilizationBuilder
        .withName(body.name)
        .addResource(
          new Resource(ResourceTypes.FOOD, INITIAL_CIVILIZATION_RESOURCES.FOOD),
          new Resource(ResourceTypes.WOOD, INITIAL_CIVILIZATION_RESOURCES.WOOD),
          new Resource(
            ResourceTypes.STONE,
            INITIAL_CIVILIZATION_RESOURCES.STONE,
          ),
        )
        .addBuilding(...INITIAL_CIVILIZATION_BUILDING)
        .addCitizen(...people)

      await civilizationService.create(
        user.id as string,
        civilizationBuilder.build(),
      )
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3 }),
      }),
    },
  )
  .delete(
    '/:civilizationId',
    async ({ civilizationService, params: { civilizationId }, user }) => {
      await civilizationService.delete(user.id as string, civilizationId)
    },
  )
  .get(
    '/:civilizationId/stats',
    ({
      params: { civilizationId },
      civilizationService,
      query: { limit = 100 },
    }) => civilizationService.getCivilizationStats(civilizationId, limit),
    {
      query: t.Object({
        limit: t.Optional(t.Number()),
      }),
    },
  )
