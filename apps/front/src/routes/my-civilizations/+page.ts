export const prerender = false
import { superValidate } from 'sveltekit-superforms'
import { getMyCivilizations } from '../../services/api/civilization-api'
import type { PageLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { newCivilizationSchema } from '$lib/schemas/newCivilization'


export const load: PageLoad = async ({ parent, fetch }) => {
  const parentData = await parent()

  const myCivilizations = await getMyCivilizations(parentData.authToken ?? '')
  return {
    myCivilizations,
    civilizationCreationForm: await superValidate(zod(newCivilizationSchema))
  }
}
