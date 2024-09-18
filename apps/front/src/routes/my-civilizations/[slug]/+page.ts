export const prerender = false
import type { PageLoad } from './$types'
import { getMyCivilizationFromId } from '../../../services/api/civilization-api'


export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent()

  console.log('TOKEN', data.authToken)

  const civilization = await getMyCivilizationFromId(data.authToken ?? '', params.slug).catch((error) => console.error('An error occured', error))
  return {
    civilization,
  }
}
