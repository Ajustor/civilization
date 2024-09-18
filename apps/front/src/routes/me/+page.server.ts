import { passwordChangeSchema } from '$lib/schemas/passwordChanger'
import { fail, superValidate } from 'sveltekit-superforms'
import { changePassword, getUser } from '../../services/api/user-api'
import type { User } from '../../stores/user'
import type { Actions, PageServerLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ cookies, url }) => {

  const isLogged = !!cookies.get('auth')
  let user: User | null = null
  if (isLogged) {
    try {
      user = await getUser(cookies)

    } catch (error) {
      console.error(error)
    }
  }

  return {
    user,
    passwordChangeForm: await superValidate(zod(passwordChangeSchema))
  }
}

export const actions: Actions = {
  default: async ({ cookies, url, ...event }) => {
    const form = await superValidate({ cookies, url, ...event }, zod(passwordChangeSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }

    await changePassword(cookies, form.data.oldPassword, form.data.newPassword).catch((e) => error(e.status, e.value.message))
    cookies.delete('auth', { path: '/' })
  }
}
