import { Elysia, NotFoundError, t } from 'elysia'
import { Patterns, cron } from '@elysiajs/cron'

import { CivilizationTable } from '../civilizations/database'
import { WorldsTable } from './database'
import { logger } from '@bogeychan/elysia-logger'
import { Gender } from '@ajustor/simulation'

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    worldDbClient: new WorldsTable(),
    civilizationsDbClient: new CivilizationTable()
  })
  .use(
    cron({
      name: 'monthPass',
      pattern: Bun.env.CRON_TIME ?? Patterns.everyMinutes(1),
      async run() {
        console.time('monthPass')
        const worldDbClient = new WorldsTable()
        const civilizationsDbClient = new CivilizationTable()

        const worlds = await worldDbClient.getAll()
        console.log('Worlds retrieved, start passing a month')
        console.timeLog('monthPass', 'Worlds retrieved, start passing a month')
        for (const world of worlds) {
          console.timeLog('monthPass', 'Retrieve civilizations')
          const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id, { people: true })
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
          console.timeEnd('monthPass')
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
  .get('/:worldId/stats', async ({ log, worldDbClient, civilizationsDbClient, params: { worldId }, query: { withAliveCount, withDeadCount, withMenAndWomenRatio, withTopCivilizations } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id, { people: true })
    world.addCivilization(...worldCivilizations)

    const worldInfos = world.getInfos()

    const aliveCivilizations = world.civilizations.filter(
      ({ people }) => people.length
    ).length

    const deadCivilizations = world.civilizations.length - aliveCivilizations

    const menAndWomen = worldInfos.civilizations.reduce(
      (count, { people }) => {
        for (const person of people) {
          if (person.gender === Gender.MALE) {
            count.men++
          }

          if (person.gender === Gender.FEMALE) {
            count.women++
          }
        }
        return count
      },
      { men: 0, women: 0 }
    )

    const topCivilizations = worldInfos.civilizations.sort(
      (
        { livedMonths: firstCivilizationLivedMonths },
        { livedMonths: secondCivilizationLivedMonths }
      ) => secondCivilizationLivedMonths - firstCivilizationLivedMonths
    ).slice(0, 3).map(({ name, livedMonths }) => ({ name, livedMonths }))

    return {
      ...(withAliveCount && { aliveCivilizations }),
      ...(withDeadCount && { deadCivilizations }),
      ...(withTopCivilizations && { topCivilizations }),
      ...(withMenAndWomenRatio && { menAndWomen })
    }
  }, {
    query: t.Optional(t.Object({
      withAliveCount: t.Optional(t.Boolean()),
      withDeadCount: t.Optional(t.Boolean()),
      withTopCivilizations: t.Optional(t.Boolean()),
      withMenAndWomenRatio: t.Optional(t.Boolean()),
    }))
  })