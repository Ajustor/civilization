import { Elysia } from 'elysia'
import { version } from '../package.json'
import { cors } from '@elysiajs/cors'
import { worldModule } from './modules/world'
import { logger } from "@bogeychan/elysia-logger"
import { usersModule } from './modules/users'
import { civilizationModule } from './modules/civilizations'
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'
import { authModule } from './modules/auth'

const app = new Elysia()
  .use(cors())
  .use(logger())
  .use(swagger())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRETS!,
    exp: '7d'
  }))
  // .use(compression())
  .get('/', () => `api-version: ${version}`)
  .use(worldModule)
  .use(authModule)
  .use(usersModule)
  .use(civilizationModule)


app.listen(3000)

console.log(`🦄 Server started at ${app.server?.url}`)

export type App = typeof app 