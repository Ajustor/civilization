import { Elysia } from 'elysia'
import { logger } from '@bogeychan/elysia-logger'
import { cron, Patterns } from '@elysiajs/cron'
import { WorldsTable } from './database'
import { db } from '../../libs/database'

const dbClient = new WorldsTable(db)

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    dbClient
  })
  .use(
    cron({
      name: 'monthPass',
      pattern: Patterns.everyHours(),
      async run() {
        const worlds = await dbClient.getAll()

        for (const world of worlds) {
          world.passAMonth()
        }

        await dbClient.saveAll(worlds)
        console.log('A month has passed')
      }
    }
    )
  )
  .get('', async ({ log, dbClient }) => {
    const worlds = await dbClient.getAll()

    return worlds.map((world) => world.getInfos()) ?? new Error('No world found')
  })