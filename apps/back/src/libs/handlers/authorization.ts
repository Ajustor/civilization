import Elysia from 'elysia'
import { jwtMiddleware } from '../jwt'
import { User } from '../../../db/schema/users'

export const authorization = (message: string) => {
  const plugin = new Elysia()
    .use(jwtMiddleware)
    .derive(async ({ jwt, cookie: { auth }, set }) => {
      const user = (await jwt.verify(auth.value) as User)

      if (!user) {
        set.status = 403
        throw new Error(message)
      }
      return { user }
    }).as('plugin')
  return plugin
}
