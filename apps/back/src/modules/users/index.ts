import Elysia from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { createUser } from '../../../db/schema/users'
import { logger } from '@bogeychan/elysia-logger'

export const usersModule = new Elysia({ prefix: '/users' })
  .use(logger())
  .decorate({
    userDbClient: new UsersTable(db)
  }).get('', async ({ userDbClient }) => {
    const users = await userDbClient.getAll()
    return users
  }).post('', async ({ log, userDbClient, body, set }) => {
    try {
      await userDbClient.create({ ...body, password: await Bun.password.hash(body.password) })
    } catch (error) {
      log.error(error)
      set.status = 409
      throw new Error('An error occured while create your account', { cause: error?.message })
    }
  }
    , { body: createUser })