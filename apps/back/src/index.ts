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
import mongoose from 'mongoose'
import { peopleModule } from './modules/people'

import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { serverTiming } from '@elysiajs/server-timing'


mongoose.connect(Bun.env.mongoConnectString ?? '')
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))

const app = new Elysia()
  .use(serverTiming())
  .use(cors())
  .use(logger())
  .use(swagger({ version }))
  .use(jwtMiddleware)
  // .use(compression())
  .use(
    opentelemetry({
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter()
        )
      ]
    })
  )
  .get('', () => `api-version: ${version}`)
  .use(worldModule)
  .use(authModule)
  .use(usersModule)
  .use(civilizationModule)
  .use(peopleModule)


app.listen(process.env.APP_PORT!)

console.log(`🦄 Server started at ${app.server?.url}`)

export type App = typeof app 