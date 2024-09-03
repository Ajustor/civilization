import Elysia, { NotFoundError, t } from 'elysia'
import { UsersTable } from '../users/database'
import { db } from '../../libs/database'
import { jwtMiddleware } from '../../libs/jwt'
import { authorization } from '../../libs/handlers/authorization'
import { addDays } from 'date-fns'
import { logger } from '@bogeychan/elysia-logger'
import { EmailSender } from '../../libs/services/emailSender'
import { IForgetEmailTemplate } from '../../emailTemplates/i-forget'

export const authModule = new Elysia({ prefix: '/auth' })
  .use(jwtMiddleware)
  .use(logger())
  .decorate({ userDbClient: new UsersTable(db), emailService: new EmailSender() })
  .post('', async ({ jwt, body, set, cookie: { auth }, userDbClient }) => {
    const user = await userDbClient.getAuthUser({ ...body })
    if (!user) {
      set.status = 404
      throw new NotFoundError('User not found')
    }
    auth.set({
      value: await jwt.sign(user),
      expires: addDays(new Date(), 7),
      secure: false,
      httpOnly: false,
      sameSite: false,
    })
  }, {
    body: t.Object(
      {
        username: t.String(),
        password: t.String()
      }
    )
  })
  .get('/i-forgot', async ({ params, userDbClient, log, emailService }) => {
    const userExist = await userDbClient.exist(params.email)
    if (!userExist) {
      return
    }

    const user = await userDbClient.getByEmail(params.email)
    if (!user) {
      return
    }

    await emailService.sendEmail(user.email, IForgetEmailTemplate({
      authorizationKey: user.authorizationKey ?? '',
      userId: user.id,
      username: user.username
    }))

  }
    , {
      params: t.Object(
        {
          email: t.String(),
        }
      )
    })
  .use(authorization('You need to connect to check your auth'))
  .get('', ({ user }) => {
    return user
  })