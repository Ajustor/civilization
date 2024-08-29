import { Elysia, NotFoundError } from 'elysia'
import { logger } from '@bogeychan/elysia-logger'
import { cron, Patterns } from '@elysiajs/cron'
import { WorldsTable } from './database'
import { db } from '../../libs/database'
import { CivilizationTable } from '../civilizations/database'

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    worldDbClient: new WorldsTable(db),
    civilizationsDbClient: new CivilizationTable(db)
  })
  .use(
    cron({
      name: 'monthPass',
      pattern: Patterns.everyMinutes(),
      async run() {
        const worldDbClient = new WorldsTable(db)
        const civilizationsDbClient = new CivilizationTable(db)

        const worlds = await worldDbClient.getAll()

        for (const world of worlds) {
          const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id)
          world.addCivilization(...worldCivilizations)
          world.passAMonth()
          await civilizationsDbClient.saveAll(worldCivilizations)
        }

        await worldDbClient.saveAll(worlds)
        console.log('A month has passed')
      }
    }
    )
  )
  .get('', async ({ log, worldDbClient, civilizationsDbClient }) => {
    const worlds = await worldDbClient.getAll()

    if (!worlds.length) {
      throw new NotFoundError('No worlds found')
    }

    for (const world of worlds) {
      const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id)
      world.addCivilization(...worldCivilizations)
    }

    return worlds.map((world) => world.getInfos())
  })