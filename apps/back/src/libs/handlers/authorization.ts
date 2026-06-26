import Elysia from 'elysia'
import { jwtMiddleware } from '../jwt'
import { bearer } from '@elysiajs/bearer'

type User = { id: string; username: string; email: string } | false

export const authorization = (message: string) => {
  const plugin = new Elysia()
    .use(jwtMiddleware)
    .use(bearer())
    .derive(async ({ jwt, cookie: { auth }, set, bearer }) => {
      // Prefer the explicit bearer token sent by the API clients over the cookie:
      // a stale/empty `auth` cookie on the API domain (e.g. cross-origin browser
      // calls with credentials) must not shadow a valid Authorization header.
      const token = bearer ?? (typeof auth.value === 'string' ? auth.value : undefined)
      const user = (await jwt.verify(token) as User)

      if (!user) {
        set.status = 403
        throw new Error(message)
      }
      return { user }
    }).as('scoped')
  return plugin
}
