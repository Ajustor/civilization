import Elysia from 'elysia'
import { jwtMiddleware } from '../jwt'
import { User } from '../../../db/schema/users'
import { bearer } from '@elysiajs/bearer'

export const authorization = (message: string) => {
  const plugin = new Elysia()
    .use(jwtMiddleware)
    .use(bearer())
    .derive(async ({ jwt, cookie: { auth }, set, bearer }) => {
      const user = (await jwt.verify(auth.value ?? bearer) as User)

      if (!user) {
        set.status = 403
        throw new Error(message)
      }
      return { user }
    }).as('plugin')
  return plugin
}
