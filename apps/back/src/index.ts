import { Elysia } from 'elysia'
import { authModule } from './modules/auth'
import { civilizationModule } from './modules/civilizations'
import { cors } from '@elysiajs/cors'
import { jwtMiddleware } from './libs/jwt'
import { logger } from "@bogeychan/elysia-logger"
import { swagger } from '@elysiajs/swagger'
import { usersModule } from './modules/users'
import { version } from '../package.json'
import { worldModule } from './modules/world'

const app = new Elysia()
  .use(cors())
  .use(logger())
  .use(swagger({ version }))
  .use(jwtMiddleware)
  // .use(compression())
  .get('', () => `api-version: ${version}`)
  .use(worldModule)
  .use(authModule)
  .use(usersModule)
  .use(civilizationModule)


app.listen(process.env.APP_PORT!)

console.log(`🦄 Server started at ${app.server?.url}`)

export type App = typeof app 