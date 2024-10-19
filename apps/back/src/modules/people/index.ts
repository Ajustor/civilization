import Elysia, { NotFoundError, t } from 'elysia'
import { authorization } from '../../libs/handlers/authorization'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'
import { PeopleService } from './service'
import { OccupationTypes, PeopleType } from '@ajustor/simulation'

const peopleService = new PeopleService()
const PEOPLE_LIMIT = 1000

export const peopleModule = new Elysia({ prefix: '/people' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ peopleService })
  .use(authorization('You must connect to check people'))
  .get('/:civilizationId', ({ peopleService, params: { civilizationId } }) => peopleService.getPeopleFromCivilization(civilizationId))
  .get('/:civilizationId/stream', async ({ params: { civilizationId }, peopleService, set }) => {
    let currentNumber = 0
    let people: PeopleType[] = []

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {

        const cursor = await peopleService.getPeopleStreamFromCivilization(civilizationId, PEOPLE_LIMIT)

        for await (const person of cursor) {
          people.push(person)
          currentNumber++
          if (people.length >= PEOPLE_LIMIT) {
            controller.enqueue(encoder.encode(JSON.stringify(people) + '\n\n\n'))
            people = []
          }
        }

        if (people.length) {
          controller.enqueue(JSON.stringify(people))
        }
        controller.close()
      }
    })

    set.headers['content-type'] = 'application/json'
    return stream
  })
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