export const prerender = false
import { fail, message, superValidate } from 'sveltekit-superforms'
import { createCivilization, getMyCivilizations } from '../../services/api/civilization-api'
import type { Actions, PageServerLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { newCivilizationSchema } from '$lib/schemas/newCivilization'
import { error } from '@sveltejs/kit'


export const load: PageServerLoad = async ({ cookies }) => {

  return {
    myCivilizations: getMyCivilizations(cookies.get('auth') ?? ''),
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
      await createCivilization(cookies.get('auth') ?? '', form.data.name)
      const myCivilizations = await getMyCivilizations(cookies.get('auth') ?? '')
      message(form, { status: 'success', text: 'Votre civilisation a bien été créée' })
      return { form, myCivilizations }
    } catch (requestError) {
      error(requestError.status, requestError.value)
    }
  }
} satisfies Actions