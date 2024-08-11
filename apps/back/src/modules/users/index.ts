import Elysia from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { createUser } from '../../../db/schema/users'

const dbClient = new UsersTable(db)

export const usersModule = new Elysia({ prefix: '/users' }).decorate({
  dbClient
}).get('', async ({ dbClient }) => {
  const users = dbClient.getAll()
  return users
}).post('', ({ body }) => {
  dbClient.create(body)
}, { body: createUser })