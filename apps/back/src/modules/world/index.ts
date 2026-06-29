import { Elysia, NotFoundError, t } from 'elysia'

import { CivilizationService } from '../civilizations/service'
import { WorldsTable } from './database'
import { logger } from '@bogeychan/elysia-logger'
import { WorldService } from './service'
import { PeopleService } from '../people/service'
import { monthWatcher } from '../../libs/services/monthWatcher'
import { WorldModel } from '../../libs/database/models'

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
  .get('', async ({ worldDbClient, civilizationsDbClient }) => {
    const worlds = await worldDbClient.getAll()

    if (!worlds.length) {
      throw new NotFoundError('No worlds found')
    }

    const worldInfos = worlds.map((world) => world.getInfos())
    return worldInfos
  })
  .get('/:worldId/aliveCivilizationsCount', async ({ worldDbClient, civilizationsDbClient, params: { worldId } }) => {
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
  // Server-Sent Events: pushes a `month` event whenever this world advances a
  // month, so connected browsers can refresh on-screen data live. Public (only
  // exposes a month number) so the browser's EventSource works without a bearer.
  .get('/:worldId/events', ({ params: { worldId } }) => {
    const encoder = new TextEncoder()
    let unsubscribe: () => void = () => { }
    let keepAlive: ReturnType<typeof setInterval>

    const stream = new ReadableStream({
      start(controller) {
        const send = (chunk: string) => {
          try {
            controller.enqueue(encoder.encode(chunk))
          } catch {
            // Connection already closed; nothing to do.
          }
        }

        send(`event: connected\ndata: {}\n\n`)

        unsubscribe = monthWatcher.onWorldMonthChange(worldId, (month) => {
          send(`event: month\ndata: ${JSON.stringify({ month })}\n\n`)
        })

        // Comment line keeps proxies from dropping the idle connection.
        keepAlive = setInterval(() => send(`: keep-alive\n\n`), 25_000)
      },
      cancel() {
        unsubscribe()
        clearInterval(keepAlive)
      },
    })

    // Return a raw Response, NOT the bare ReadableStream: when a handler returns
    // a ReadableStream, Elysia treats it as a generator stream and re-serialises
    // every chunk as `data: <JSON>\n\n`. That double-wraps our already-formatted
    // SSE frames (the browser then only ever sees anonymous `message` events, so
    // `addEventListener('month', …)` never fires and the live refresh is dead).
    // A returned Response is passed through verbatim, keeping the `event: month`
    // frames intact.
    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        // Disable proxy buffering (nginx & co) so events are flushed immediately.
        'x-accel-buffering': 'no',
      },
    })
  })
  // Lightweight current-month endpoint, used as a polling fallback for the live
  // refresh when SSE is blocked/buffered by a reverse proxy.
  .get('/:worldId/month', async ({ params: { worldId } }) => {
    const world = await WorldModel.findOne({ _id: worldId }, 'month')
    return { month: world?.month ?? 0 }
  })
  .get('/:worldId/civilizations', async ({ civilizationsDbClient, params: { worldId } }) => {
    const civilizations = await civilizationsDbClient.getAllRawByWorldId(worldId, { people: false })
    return {
      civilizations: civilizations.map((civ) => ({
        id: civ.id,
        name: civ.name,
      })),
    }
  })