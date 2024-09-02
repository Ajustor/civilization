import type { PageServerLoad } from './$types'
import type { Actions } from './$types'
import { loginSchema } from '$lib/schemas/login'
import { message, superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { fail, redirect } from '@sveltejs/kit'
import { login } from '../../services/api/user-api'

export const load: PageServerLoad = async ({ cookies, url }) => {
  console.log(url)
  return {
    loginForm: await superValidate(zod(loginSchema))
  }
}

export const actions: Actions = {
  default: async ({ cookies, url, ...event }) => {
    const form = await superValidate({ cookies, url, ...event }, zod(loginSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }
    console.log(url)
    await login(form.data.username, form.data.password, cookies).catch(error => message(form, { status: 'error', text: 'Aucun utilisateur trouvé pour ces informations de connexion' }, error))
    const redirectTo = url.searchParams.get('redirectTo')
    if (redirectTo) {
      throw redirect(302, `/${redirectTo.slice(1)}`)
    }
    throw redirect(302, '/')

  }
}