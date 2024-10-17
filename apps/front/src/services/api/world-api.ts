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
  return worlds.reduce((acc, world) => {
    acc.set(world.id, getWorldStats(world.id, { withAliveCount: true, withDeadCount: true, withTopCivilizations: true }))
    return acc
  }, new Map<string, Promise<WorldStats>>())
}

export async function getWorldsMenAndWomenRatio() {
  const worlds = await getWorldsInfos()
  const worldsMenAndWomenRatio = new Map<string, { men: number, women: number }>()
  for (const world of worlds) {
    const { menAndWomen } = await getWorldStats(world.id, { withMenAndWomenRatio: false })
    if (menAndWomen) {
      worldsMenAndWomenRatio.set(world.id, menAndWomen)
    }
  }
  return worldsMenAndWomenRatio
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