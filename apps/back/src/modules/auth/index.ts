import Elysia, { NotFoundError, t } from 'elysia'
import { UsersTable } from '../users/database'
import { db } from '../../libs/database'
import { jwtMiddleware } from '../../libs/jwt'

export const authModule = new Elysia({ prefix: '/auth' })
  .use(jwtMiddleware)
  .decorate({ userDbClient: new UsersTable(db) })
  .post('', async ({ jwt, body, set, cookie: { auth }, userDbClient }) => {
    const user = await userDbClient.getAuthUser({ ...body })
    if (!user) {
      set.status = 404
      throw new NotFoundError('User not found')
    }
    auth.set({

      value: await jwt.sign(user)
    })
  }, {
    body: t.Object(
      {
        username: t.String(),
        password: t.String()
      }
    )
  })
  .get('', ({ jwt, cookie: { auth } }) => {
    return jwt.verify(auth.value)
  })