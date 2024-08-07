import { Elysia } from 'elysia'
import { version } from '../package.json'
import { cors } from '@elysiajs/cors'
import { worldModule } from './modules/world'
import { logger } from "@bogeychan/elysia-logger"
import { compression } from '@chneau/elysia-compression'


const app = new Elysia()
  .use(cors())
  .use(logger())
  .use(compression())
  .get('/', () => `api-version: ${version}`)
  .use(worldModule)


app.listen(3000)

export type App = typeof app 