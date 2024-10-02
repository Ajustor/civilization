import { client } from './client'

export async function getWorldsInfos() {
  const { data: worldInfos, error } = await client.worlds.get()
  console.log(worldInfos, error)

  if (error) {
    console.error(error)
    throw error
  }

  return worldInfos
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