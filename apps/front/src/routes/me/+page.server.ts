import type { PageServerLoad } from './$types'
import type { Actions } from './$types'
import { loginSchema } from '$lib/schemas/login'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { fail } from '@sveltejs/kit'
import { getUser, login } from '../../services/api/user-api'

export const load: PageServerLoad = async ({ cookies }) => {
  const isLogged = !!cookies.get('auth')
  let user: { username: string, id: string, email: string } | null = null
  if (isLogged) {
    try {
      user = await getUser(cookies)

    } catch (error) {
      console.error(error)
    }

  }

  return {
    isLogged,
    user,
    loginForm: await superValidate(zod(loginSchema))
  }
}

export const actions: Actions = {
  login: async ({ cookies, ...event }) => {
    const form = await superValidate({ cookies, ...event }, zod(loginSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }
    try {
      await login(form.data.username, form.data.password, cookies)
      const user = await getUser(cookies)
      return { user }
    } catch (error) {
      console.error(error)
    }
  }
} satisfies Actions