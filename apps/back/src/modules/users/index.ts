import Elysia, { NotFoundError, t } from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { createUser } from '../../../db/schema/users'
import { logger } from '@bogeychan/elysia-logger'
import { authorization } from '../../libs/handlers/authorization'
import { NewUserEmailTemplate } from '../../emailTemplates/newUser'

export const usersModule = new Elysia({ prefix: '/users' })
  .use(logger())
  .decorate({
    userDbClient: new UsersTable(db),
  }).get('', async ({ userDbClient }) => {
    const users = await userDbClient.getAll()
    return users.map(({ password, ...user }) => user)
  })
  .post('', async ({ log, userDbClient, body, set, emailService }) => {
    try {
      await userDbClient.create({ ...body, password: await Bun.password.hash(body.password) })
      await emailService.sendEmail(body.email, 'Un nouvel arrivant !', NewUserEmailTemplate({ username: body.username }))
    } catch (error) {
      log.error(error)
      set.status = 409
      throw new Error('An error occured while create your account', { cause: error?.message })
    }
  }
    , { body: createUser })
  .post('/i-forgot', async ({ body, userDbClient, log }) => {
    try {
      await userDbClient.resetPassword({ ...body })
    } catch (error) {
      log.error(error)
      throw new NotFoundError(error.message)
    }
  }
    , {
      body: t.Object(
        {
          userId: t.String(),
          password: t.String(),
          authorizationKey: t.String()
        }
      )
    })
  .use(authorization('You need to login to access this route'))
  .get('/me', async ({ user, userDbClient }) => {
    const selectedUser = await userDbClient.getById(user.id)
    return { user: selectedUser }
  })
  .get('/:userId', async ({ params: { userId }, userDbClient }) => {
    const selectedUser = await userDbClient.getById(userId)
    return { user: selectedUser }
  })