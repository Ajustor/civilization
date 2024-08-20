import Elysia from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { createUser } from '../../../db/schema/users'

export const usersModule = new Elysia({ prefix: '/users' }).decorate({
  userDbClient: new UsersTable(db)
}).get('', async ({ userDbClient }) => {
  const users = await userDbClient.getAll()
  return users
}).post('', async ({ userDbClient, body }) =>
  userDbClient.create({ ...body, password: await Bun.password.hash(body.password) })
  , { body: createUser })