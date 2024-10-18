import { client } from './client'

type WorldStats = {
  aliveCivilizations?: Promise<number>,
  deadCivilizations?: Promise<number>,
  menAndWomen?: Promise<{ men: number, women: number }>,
  topCivilizations?: Promise<{ name: string, livedMonths: number }[]>
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
    acc.set(world.id, {
      aliveCivilizations: getAliveCivilizationsCount(world.id),
      deadCivilizations: getDeadCivilizationsCount(world.id),
      topCivilizations: getTopCivilizations(world.id),
      menAndWomen: getMenAndWmenRatio(world.id)
    })
    return acc
  }, new Map<string, WorldStats>())
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

async function getMenAndWmenRatio(worldId: string) {
  const { data: aliveCivilizationsCount, error } = await client.worlds({ worldId }).menAndWomenRatio.get()
  if (error) {
    console.error(error)
    throw error
  }
  return aliveCivilizationsCount
}

async function getAliveCivilizationsCount(worldId: string) {
  const { data: aliveCivilizationsCount, error } = await client.worlds({ worldId }).aliveCivilizationsCount.get()
  if (error) {
    console.error(error)
    throw error
  }
  return aliveCivilizationsCount
}

async function getDeadCivilizationsCount(worldId: string) {
  const { data: deadCivilizationsCount, error } = await client.worlds({ worldId }).deadCivilizationsCount.get()
  if (error) {
    console.error(error)
    throw error
  }
  return deadCivilizationsCount
}

async function getTopCivilizations(worldId: string) {
  const { data: topCivilizations, error } = await client.worlds({ worldId }).topCivilizations.get()
  if (error) {
    console.error(error)
    throw error
  }
  return topCivilizations
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