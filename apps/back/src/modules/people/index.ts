import Elysia from 'elysia'
import { authorization } from '../../libs/handlers/authorization'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'
import { PeopleService } from './service'
import { CivilizationService } from '../civilizations/service'

const civilizationService = new CivilizationService()
const peopleService = new PeopleService(civilizationService)

export const peopleModule = new Elysia({ prefix: '/people' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ peopleService })
  .use(authorization('You must connect to check people'))
  .get('/:civilizationId', ({ peopleService, params: { civilizationId } }) => peopleService.getPeopleFromCivilization(civilizationId))