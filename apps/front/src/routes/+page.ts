export const prerender = false
import { getWorldsInfos } from '../services/api/world-api'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const worlds = await getWorldsInfos()


  return {
    worlds: worlds.map(({ name, id, month, resources, year }) => ({ name, id, month, year, resources })),
  }
}

