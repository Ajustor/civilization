export const prerender = false
import { getWorldsInfos, getWorldStats } from '../services/api/world-api'
import type { PageServerLoad } from './$types'

type WorldStats = {
  aliveCivilizations?: number,
  deadCivilizations?: number,
  menAndWomen?: { men: number, women: number },
  topCivilizations?: { name: string, livedMonths: number }[]
}

export const load: PageServerLoad = async () => {
  const worlds = await getWorldsInfos()

  return {
    worlds,
    lazy: {
        worldsStats: worlds.reduce((acc, world) => {
      acc.set(world.id, getWorldStats(world.id, { withAliveCount: true, withDeadCount: true, withMenAndWomenRatio: true, withTopCivilizations: true }))
      return acc
    }, new Map<string, Promise<WorldStats>>())
    }
  }
}

