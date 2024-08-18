import Elysia, { NotFoundError, t } from 'elysia'
import { UsersTable } from '../users/database'
import { db } from '../../libs/database'

export const authModule = new Elysia({ prefix: '/auth' })
  .decorate({ userDbClient: new UsersTable(db) })
  .post('', async ({ jwt, body, set, cookie: { auth }, userDbClient }) => {
    console.log(body)
    const user = await userDbClient.getUser({ ...body, password: await Bun.password.hash(body.password) })
    if (!user) {
      set.status = 404
      throw new NotFoundError('User not found')
    }
    auth.set({
      httpOnly: true,
      value: jwt.sign(user)
    })
    jwt.sign(body)
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