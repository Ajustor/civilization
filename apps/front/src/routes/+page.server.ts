export const prerender = false
import { getWorldsInfos, getWorldsStats, getWorldsMenAndWomenRatio } from '../services/api/world-api'
import type { PageServerLoad } from './$types'


export const load: PageServerLoad = async () => {
  return {
    lazy: {
      worldsStats: getWorldsStats(),
      menAndWomenRatio: getWorldsMenAndWomenRatio()
    },
    worlds: await getWorldsInfos(),
  }
}

