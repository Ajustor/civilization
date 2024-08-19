import Elysia from 'elysia'
import { CivilizationTable } from './database'
import { db } from '../../libs/database'
import { logger } from '@bogeychan/elysia-logger'
import { jwtMiddleware } from '../../libs/jwt'

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationDbClient: new CivilizationTable(db) })
  .get('', async ({ civilizationDbClient, log }) => {
    const civilizations = await civilizationDbClient.getAll()
    return civilizations
  })
  .post('', ({ jwt, cookie: { auth }, set }) => {
    const user = jwt.verify(auth.value)
    if (!user) {
      set.status = 403
      throw new Error('You need to connect to create a civilization')
    }
  })
