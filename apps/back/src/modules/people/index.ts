import Elysia, { NotFoundError, t } from 'elysia'
import { authorization } from '../../libs/handlers/authorization'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'
import { PeopleService, personMapper } from './service'
import { OccupationTypes, PeopleType } from '@ajustor/simulation'


const peopleService = new PeopleService()
const PEOPLE_LIMIT = 1000

export const peopleModule = new Elysia({ prefix: '/people' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ peopleService })
  .post('/snap', ({ peopleService, body: { key } }) => {

    if (key !== process.env.SNAP_KEY!) {
      return 'You need the infinity stones to do this'
    }

    return peopleService.snap()
  }, {
    body: t.Object({
      key: t.String()
    })
  })
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
          controller.enqueue(encoder.encode(JSON.stringify(people) + '\n\n\n'))
        }
        controller.close()
      }
    })

    set.headers['content-type'] = 'application/json'
    return stream
  })
  .get('/:civilizationId/paginated', ({ peopleService, params: { civilizationId }, query: {
    page = 0, count = 10, sort
  } }) => peopleService.getPeopleFromCivilizationPaginated(civilizationId, count, page, sort), {
    query: t.Optional(t.Object({
      count: t.Number({ minimum: 0 }),
      page: t.Number({ minimum: 0 }),
      sort: t.Optional(t.Object({
        field: t.String(),
        order: t.Union([
          t.TemplateLiteral('${asc|ascending|desc|descending}'),
          t.Literal(1),
          t.Literal(-1)
        ])
      }))
    }))
  })
  .get('/:civilizationId/stats', async ({ peopleService, params: { civilizationId } }) => {
    const peoples = await peopleService.getPeopleFromCivilization(civilizationId)
    if (!peoples) {
      throw new NotFoundError('No civilization found for this id')
    }

    const menAndWomen = await peopleService.countGenders(civilizationId)
    const pregnantWomen = await peopleService.countPregnant(civilizationId)
    const jobs: { [key in OccupationTypes | 'child']?: number } = {}

    for (const rawPerson of peoples) {
      const person = personMapper(rawPerson)
      if (person.work && (person.work.canWork(person.years) || person.work.occupationType === OccupationTypes.RETIRED)) {
        jobs[person.work.occupationType] = (jobs[person.work.occupationType] ?? 0) + 1
      } else if (person.work && !person.work.canWork(person.years) && person.work.occupationType !== OccupationTypes.RETIRED) {
        jobs['child'] = (jobs['child'] ?? 0) + 1
      }
    }

    return { menAndWomen, pregnantWomen, jobs }
  })
  .get('/:civilizationId/stats/peopleRatio', async ({ peopleService, params: { civilizationId } }) => {
    const [menAndWomen, pregnantWomen] = await Promise.all([
      peopleService.countGenders(civilizationId),
      peopleService.countPregnant(civilizationId)
    ])

    return { menAndWomen, pregnantWomen }
  })
  .get('/:civilizationId/stats/jobs', async ({ peopleService, params: { civilizationId } }) => {
    const jobs: { [key in OccupationTypes]?: number } = {}

    for (const job of Object.values(OccupationTypes)) {
      const stat = await peopleService.countPeopleWithJob(civilizationId, job)
      jobs[job] = stat
    }

    return jobs
  })
