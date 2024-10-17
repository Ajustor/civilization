import { client } from './client'

type WorldStats = {
  aliveCivilizations?: number,
  deadCivilizations?: number,
  menAndWomen?: { men: number, women: number },
  topCivilizations?: { name: string, livedMonths: number }[]
}


export async function getWorldsInfos() {
  const { data: worldInfos, error } = await client.worlds.get()

  if (error) {
    console.error(error)
    throw error
  }

  return worldInfos
}

export async function getWorldsStats() {
  const worlds = await getWorldsInfos()
  const worldsStats = new Map<string, WorldStats>()

  for (const world of worlds) {
    worldsStats.set(world.id, await getWorldStats(world.id, { withAliveCount: true, withDeadCount: true, withMenAndWomenRatio: true, withTopCivilizations: true }))
  }
  return worldsStats
}

export async function getWorldStats(worldId: string, query: {
  withAliveCount?: boolean,
  withDeadCount?: boolean,
  withMenAndWomenRatio?: boolean,
  withTopCivilizations?: boolean
} = {}) {
  const { data: worldStats, error } = await client.worlds({ worldId }).stats.get({
    query
  })

  if (error) {
    console.error(error)
    throw error
  }

  return {
    ...(query.withAliveCount && { aliveCivilizations: worldStats.aliveCivilizations }),
    ...(query.withDeadCount && { deadCivilizations: worldStats.deadCivilizations }),
    ...(query.withMenAndWomenRatio && { menAndWomen: worldStats.menAndWomen }),
    ...(query.withTopCivilizations && { topCivilizations: worldStats.topCivilizations })
  }
}