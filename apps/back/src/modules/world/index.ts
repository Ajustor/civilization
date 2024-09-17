import { Elysia, NotFoundError } from 'elysia'
import { Patterns, cron } from '@elysiajs/cron'

import { CivilizationTable } from '../civilizations/database'
import { WorldsTable } from './database'
import { db } from '../../libs/database'
import { logger } from '@bogeychan/elysia-logger'

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    worldDbClient: new WorldsTable(db),
    civilizationsDbClient: new CivilizationTable(db)
  })
  .use(
    cron({
      name: 'monthPass',
      pattern: Bun.env.CRON_TIME ?? Patterns.everyMinutes(15),
      async run() {
        console.time('monthPass')
        const worldDbClient = new WorldsTable(db)
        const civilizationsDbClient = new CivilizationTable(db)

        const worlds = await worldDbClient.getAll()
        console.log('Worlds retrieved, start passing a month')
        console.timeLog('monthPass', 'Worlds retrieved, start passing a month')
        for (const world of worlds) {
          console.timeLog('monthPass', 'Retrieve civilizations')
          const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id)
          world.addCivilization(...worldCivilizations.filter((civilization) => civilization.people.length).sort(() => Math.random() - 0.5))
          console.timeLog('monthPass', 'Civilizations retrieved, pass a month')

          world.passAMonth()
          console.timeLog('monthPass', 'Month has passed, save civilizations')
          await civilizationsDbClient.saveAll(worldCivilizations)
          console.timeLog('monthPass', 'Civilizations saved')
        }
        console.timeLog('monthPass', 'Civilizations saved, save the worlds')

        try {
          await worldDbClient.saveAll(worlds)
          console.timeEnd('monthPass','A month has passed')
        } catch (error) {
          console.error(error)
        }

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

    const worldInfos = worlds.map((world) => world.getInfos())
    return worldInfos
  })