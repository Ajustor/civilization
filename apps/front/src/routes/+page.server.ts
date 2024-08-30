export const prerender = false
import { getWorldsInfos } from '../services/api/world-api'
import type { PageServerLoad } from './$types'


export const load: PageServerLoad = async () => {
  const worlds = await getWorldsInfos()
  return {
    worlds,
  }
}

