import jwt from '@elysiajs/jwt'

export const jwtMiddleware = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRETS!,
  exp: '7d'
})