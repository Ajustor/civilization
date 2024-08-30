import type { PageServerLoad } from './$types'
import type { Actions } from './$types'
import { loginSchema } from '$lib/schemas/login'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { fail } from '@sveltejs/kit'
import { login } from '../../services/api/user-api'

export const load: PageServerLoad = async ({ cookies }) => {
  const isLogged = !!cookies.get('auth')
  return {
    isLogged,
    loginForm: await superValidate(zod(loginSchema))
  }
}

export const actions: Actions = {
  login: async (event) => {
    const form = await superValidate(event, zod(loginSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }
    try {
      return await login(form.data.username, form.data.password)
    } catch (error) {
      console.error(error)
    }
  }
} satisfies Actions