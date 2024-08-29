import { Elysia } from 'elysia'
import { version } from '../package.json'
import { cors } from '@elysiajs/cors'
import { worldModule } from './modules/world'
import { logger } from "@bogeychan/elysia-logger"
import { usersModule } from './modules/users'
import { civilizationModule } from './modules/civilizations'
import { swagger } from '@elysiajs/swagger'
import { authModule } from './modules/auth'
import { jwtMiddleware } from './libs/jwt'

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


app.listen(3000)

console.log(`🦄 Server started at ${app.server?.url}`)

export type App = typeof app 