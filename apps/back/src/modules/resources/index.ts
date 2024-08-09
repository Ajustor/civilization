import { Elysia } from 'elysia'
import { logger } from '@bogeychan/elysia-logger'

export const worldModule = new Elysia({ prefix: '/resources' })
  .use(logger())
  .get('', ({ log, }) => {

    return []
  })