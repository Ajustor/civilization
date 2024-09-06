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
      pattern: Bun.env.CRON_TIME ?? Patterns.everyHours(),
      async run() {
        const worldDbClient = new WorldsTable(db)
        const civilizationsDbClient = new CivilizationTable(db)

        const worlds = await worldDbClient.getAll()
        console.log('Worlds retrieved, start passing a month')
        for (const world of worlds) {
          const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id)
          world.addCivilization(...worldCivilizations.filter((civilization)=> civilization.getCitizens().length))
          world.passAMonth()
          await civilizationsDbClient.saveAll(worldCivilizations)
        }

        console.log('Civilizations saved, save the worlds')
        try {
          await worldDbClient.saveAll(worlds)
          console.log('A month has passed')
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