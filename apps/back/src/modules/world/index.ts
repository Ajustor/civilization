import { Elysia } from 'elysia'
import { World } from '../../simulation/world'
import { logger } from '@bogeychan/elysia-logger'
import { cron, Patterns } from '@elysiajs/cron'

export const worldModule = new Elysia({ prefix: '/world' })
  .use(logger())
  .state('world', new World())
  .use(
    cron({
      name: 'monthPass',
      pattern: Patterns.hourly(),
      run() {
        console.log("Heartbeat")
      }
    }
    )
  )
  .get('', ({ store: { world }, log, }) => {
    const infos = world?.getInfos()

    return infos ?? new Error('No world found')
  })