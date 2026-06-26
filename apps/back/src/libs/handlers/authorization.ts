import Elysia from 'elysia'
import { jwtMiddleware } from '../jwt'
import { User } from '../../../db/schema/users'
import { bearer } from '@elysiajs/bearer'

export const authorization = (message: string) => {
  const plugin = new Elysia()
    .use(jwtMiddleware)
    .use(bearer())
    .derive(async ({ jwt, cookie: { auth }, set, bearer }) => {
      // Prefer the explicit bearer token sent by the API clients over the cookie:
      // a stale/empty `auth` cookie on the API domain (e.g. cross-origin browser
      // calls with credentials) must not shadow a valid Authorization header.
      const user = (await jwt.verify(bearer || auth.value) as User)

      if (!user) {
        set.status = 403
        throw new Error(message)
      }
      return { user }
    }).as('plugin')
  return plugin
}
