import { Elysia, NotFoundError, t } from 'elysia'

import { CivilizationService } from '../civilizations/service'
import { WorldsTable } from './database'
import { logger } from '@bogeychan/elysia-logger'
import { WorldService } from './service'
import { PeopleService } from '../people/service'

const worldDbClientInstance = new WorldsTable()
const peopleServiceInstance = new PeopleService()
const civilizationsDbClientInstance = new CivilizationService(peopleServiceInstance)
const worldServiceInstance = new WorldService(worldDbClientInstance, civilizationsDbClientInstance)

export const worldModule = new Elysia({ prefix: '/worlds' })
  .use(logger())
  .decorate({
    worldDbClient: worldDbClientInstance,
    worldService: worldServiceInstance,
    civilizationsDbClient: civilizationsDbClientInstance,
    peopleService: peopleServiceInstance
  })
  .get('', async ({ log, worldDbClient, civilizationsDbClient }) => {
    const worlds = await worldDbClient.getAll()

    if (!worlds.length) {
      throw new NotFoundError('No worlds found')
    }

    const worldInfos = worlds.map((world) => world.getInfos())
    return worldInfos
  })
  .get('/:worldId/aliveCivilizationsCount', async ({ log, worldDbClient, civilizationsDbClient, params: { worldId } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    const worldCivilizations = await civilizationsDbClient.getAllRawByWorldId(world.id, { people: false })

    const aliveCivilizationsCount = worldCivilizations.filter(
      ({ people }) => people?.length
    ).length
    return aliveCivilizationsCount
  })
  .get('/:worldId/deadCivilizationsCount', async ({ log, worldDbClient, civilizationsDbClient, params: { worldId } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    const worldCivilizations = await civilizationsDbClient.getAllRawByWorldId(world.id, { people: false })

    const deadCivilizationsCount = worldCivilizations.filter(
      ({ people }) => !people?.length
    ).length
    return deadCivilizationsCount
  })
  .get('/:worldId/topCivilizations', async ({ log, worldDbClient, worldService, params: { worldId } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    return worldService.topCivilizations(worldId)
  })
  .get('/:worldId/menAndWomenRatio', async ({ log, worldDbClient, worldService, params: { worldId } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    return worldService.getWorldMenAndWomen(worldId)
  })
  .get('/:worldId/stats', async ({ log, worldDbClient, worldService, civilizationsDbClient, params: { worldId }, query: { withAliveCount, withDeadCount, withMenAndWomenRatio, withTopCivilizations } }) => {
    const world = await worldDbClient.getById(worldId)

    if (!world) {
      throw new NotFoundError('No world found')
    }

    const worldCivilizations = await civilizationsDbClient.getAllRawByWorldId(world.id, { people: false })

    const aliveCivilizations = worldCivilizations.filter(
      ({ people }) => people?.length
    ).length

    const deadCivilizations = worldCivilizations.length - aliveCivilizations

    let topCivilizations
    if (withTopCivilizations) {
      topCivilizations = await worldService.topCivilizations(worldId)
    }

    let menAndWomen
    if (withMenAndWomenRatio) {
      menAndWomen = await worldService.getWorldMenAndWomen(worldId)
    }

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