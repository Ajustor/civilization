export const prerender = true
import { getWorldsInfos } from '../services/api/world-api'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const worlds = getWorldsInfos()

  return {
    worlds
  }
}

