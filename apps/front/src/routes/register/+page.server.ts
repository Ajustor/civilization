import type { PageServerLoad } from './$types'
import type { Actions } from './$types'
import { message, superValidate, fail } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import { redirect } from '@sveltejs/kit'
import { createNewUser } from '../../services/api/user-api'
import { newUserSchema } from '$lib/schemas/newUser'

export const load: PageServerLoad = async ({ cookies, url }) => {
  return {
    newUserForm: await superValidate(zod(newUserSchema))
  }
}

export const actions: Actions = {
  default: async ({ cookies, url, ...event }) => {
    const form = await superValidate({ cookies, url, ...event }, zod(newUserSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }
    try {
      await createNewUser(form.data.email, form.data.password, form.data.username)
    } catch (error) {
      // Surface the real failure instead of silently redirecting to /login.
      return message(
        form,
        { status: 'error', text: (error as { value?: string })?.value ?? 'Impossible de créer le compte' },
        { status: 409 }
      )
    }

    throw redirect(302, '/login')
  }
}
