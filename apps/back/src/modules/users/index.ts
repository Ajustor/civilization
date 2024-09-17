import Elysia, { NotFoundError, t } from 'elysia'
import { UsersTable } from './database'
import { db } from '../../libs/database'
import { logger } from '@bogeychan/elysia-logger'
import { authorization } from '../../libs/handlers/authorization'
import { NewUserEmailTemplate } from '../../emailTemplates/newUser'
import { emailSender } from '../../libs/services/emailSender'

export const usersModule = new Elysia({ prefix: '/users' })
  .use(logger())
  .use(emailSender)
  .decorate({
    userDbClient: new UsersTable(db),
  }).get('', async ({ userDbClient }) => {
    const users = await userDbClient.getAll()
    return users.map(({ password, ...user }) => user)
  })
  .post('', async ({ log, userDbClient, body, set, emailSender }) => {
    try {
      await userDbClient.create({ ...body, password: await Bun.password.hash(body.password) })
      await emailSender.sendEmail(body.email, 'Un nouvel arrivant !', NewUserEmailTemplate({ username: body.username, frontUrl: Bun.env.frontUrl ?? '' }))
      set.status = 201
    } catch (error) {
      log.error(error)
      set.status = 409
      throw new Error('An error occured while create your account', { cause: error?.message })
    }
  }
    , {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        email: t.String()
      })
    })
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
  .patch('/update-password', ({ user, userDbClient, body: { oldPassword, newPassword } }) => userDbClient.changePassword({ userId: user.id, oldPassword, newPassword }), {
    body: t.Object({
      oldPassword: t.String(),
      newPassword: t.String()
    })
  })