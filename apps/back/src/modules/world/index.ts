import { Elysia, NotFoundError } from 'elysia'
import { logger } from '@bogeychan/elysia-logger'
import { cron, Patterns } from '@elysiajs/cron'
import { WorldsTable } from './database'
import { db } from '../../libs/database'

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    worldDbClient: new WorldsTable(db)
  })
  .use(
    cron({
      name: 'monthPass',
      pattern: Patterns.everyHours(),
      async run() {
        const worldDbClient = new WorldsTable(db)

        const worlds = await worldDbClient.getAll()

        for (const world of worlds) {
          world.passAMonth()
        }

        await worldDbClient.saveAll(worlds)
        console.log('A month has passed')
      }
    }
    )
  )
  .get('', async ({ log, worldDbClient }) => {
    const worlds = await worldDbClient.getAll({ populate: { resources: true } })

    if (!worlds.length) {
      throw new NotFoundError('No worlds found')
    }

    return worlds.map((world) => world.getInfos())
  })