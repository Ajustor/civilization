import Elysia, { NotFoundError, t } from 'elysia'
import { authorization } from '../../libs/handlers/authorization'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'
import { PeopleService } from './service'
import { CivilizationService } from '../civilizations/service'
import { OccupationTypes } from '@ajustor/simulation'

const civilizationService = new CivilizationService()
const peopleService = new PeopleService(civilizationService)

export const peopleModule = new Elysia({ prefix: '/people' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ peopleService })
  .use(authorization('You must connect to check people'))
  .get('/:civilizationId', ({ peopleService, params: { civilizationId } }) => peopleService.getPeopleFromCivilization(civilizationId))
  .get('/:civilizationId/paginated', ({ peopleService, params: { civilizationId }, query: {
    page = 0, count = 10
  } }) => peopleService.getPeopleFromCivilizationPaginated(civilizationId, count, page), {
    query: t.Optional(t.Object({
      count: t.Number({ minimum: 0 }),
      page: t.Number({ minimum: 0 })
    }))
  })
  .get('/:civilizationId/stats', async ({ peopleService, params: { civilizationId } }) => {
    const peoples = await peopleService.getRawPeopleFromCivilization(civilizationId)
    if (!peoples) {
      throw new NotFoundError('No civilization found for this id')
    }

    const menAndWomen = await peopleService.countGenders(civilizationId)
    const pregnantWomen = await peopleService.countPregnant(civilizationId)
    const jobs: { [key in OccupationTypes]?: number } = {}

    for (const person of peoples) {
      if (person.occupation) {
        jobs[person.occupation] = (jobs[person.occupation] ?? 0) + 1
      }
    }


    return { menAndWomen, pregnantWomen, jobs }
  })