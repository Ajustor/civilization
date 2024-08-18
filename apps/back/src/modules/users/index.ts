import Elysia from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { createUser } from '../../../db/schema/users'

export const usersModule = new Elysia({ prefix: '/users' }).decorate({
  userDbClient: new UsersTable(db)
}).get('', async ({ userDbClient }) => {
  const users = userDbClient.getAll()
  return users
}).post('', ({ userDbClient, body }) => {
  userDbClient.create(body)
}, { body: createUser })