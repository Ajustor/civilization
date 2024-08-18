import Elysia from 'elysia'
import { CivilizationTable } from './database'
import { db } from '../../libs/database'
import { logger } from '@bogeychan/elysia-logger'

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .decorate({ civilizationDbClient: new CivilizationTable(db) })
  .get('', async ({ civilizationDbClient, log }) => {
    const civilizations = await civilizationDbClient.getAll()
    return civilizations
  })
