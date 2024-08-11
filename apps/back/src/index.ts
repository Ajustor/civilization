import { Elysia } from 'elysia'
import { version } from '../package.json'
import { cors } from '@elysiajs/cors'
import { worldModule } from './modules/world'
import { logger } from "@bogeychan/elysia-logger"
import { usersModule } from './modules/users'


const app = new Elysia()
  .use(cors())
  .use(logger())
  // .use(compression())
  .get('/', () => `api-version: ${version}`)
  .use(worldModule)
  .use(usersModule)


app.listen(3000)

console.log(`🦄 Server started at ${app.server?.url}`)

export type App = typeof app 