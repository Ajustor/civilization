import { Context } from 'elysia'

export const auth = async ({ jwt, cookie: { auth }, set }: Context) => {
  const user = await jwt.verify(auth.value)
  if (!user) {
    set.status = 403
    throw new Error('You need to connect to create a civilization')
  }
}