export const prerender = false
import { fail, superValidate } from 'sveltekit-superforms'
import { createCivilization, getMyCivilizations } from '../../services/api/civilization-api'
import type { Actions, PageServerLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { newCivilizationSchema } from '$lib/schemas/newCivilization'


export const load: PageServerLoad = async ({ cookies }) => {
  const myCivilizations = await getMyCivilizations(cookies)
  return {
    myCivilizations,
    civilizationCreationForm: await superValidate(zod(newCivilizationSchema))
  }
}

export const actions: Actions = {
  createNewCivilization: async ({ cookies, ...event }) => {
    const form = await superValidate({ cookies, ...event }, zod(newCivilizationSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }
    try {
      await createCivilization(cookies, form.data.name)
      const myCivilizations = await getMyCivilizations(cookies)
      return { form, myCivilizations }
    } catch (error) {
      console.error(error)
    }
  }
} satisfies Actions