export const prerender = false
import { Gender } from '@ajustor/simulation'
import { getWorldsInfos } from '../services/api/world-api'
import { arrayToMap } from '../utils/arrayToMap'
import type { PageServerLoad } from './$types'


export const load: PageServerLoad = async () => {
  const worlds = await getWorldsInfos()
  const aliveCivilizationsIndexedByWorldId = arrayToMap(worlds, ({ id }) => id, ({ civilizations }) => civilizations.filter(
    ({ people }) => people.length
  ).length)

  const deadCivilizationsIndexedByWorldId = arrayToMap(worlds, ({ id }) => id, ({ id, civilizations }) => civilizations.length - (aliveCivilizationsIndexedByWorldId.get(id) ?? 0))

  const menAndWomenIndexedByWorldId = arrayToMap(worlds, ({ id }) => id, ({ civilizations }) => civilizations.reduce(
    (count, { people }) => {
      for (const person of people) {
        if (person.gender === Gender.MALE) {
          count.men++
        }

        if (person.gender === Gender.FEMALE) {
          count.women++
        }
      }
      return count
    },
    { men: 0, women: 0 }
  ))

  const topCivilizationsIndexedByWorldId = arrayToMap(worlds, ({ id }) => id, ({ civilizations }) => civilizations.sort(
    (
      { livedMonths: firstCivilizationLivedMonths },
      { livedMonths: secondCivilizationLivedMonths }
    ) => secondCivilizationLivedMonths - firstCivilizationLivedMonths
  ).slice(0, 3))

  return {
    worlds: worlds.map(({ name, id, month, resources, year }) => ({ name, id, month, year, resources })),
    deadCivilizationsIndexedByWorldId,
    aliveCivilizationsIndexedByWorldId,
    menAndWomenIndexedByWorldId,
    topCivilizationsIndexedByWorldId
  }
}

