import { fail, message, superValidate } from 'sveltekit-superforms'
import type { Actions } from './$types'
import type { PageServerLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { iForgotSchema } from '$lib/schemas/iForgot'
import { forgotPasswordUpdate } from '../../services/api/user-api'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ url }) => {
  return {
    iForgotForm: await superValidate(zod(iForgotSchema)),
    authorizationKey: url.searchParams.get('authorizationKey') ?? '',
    userId: url.searchParams.get('userId') ?? ''
  }
}

export const actions: Actions = {
  default: async ({ cookies, url, ...event }) => {
    const form = await superValidate({ cookies, url, ...event }, zod(iForgotSchema))
    if (!form.valid) {
      return fail(400, {
        form,
      })
    }

    try {
      await forgotPasswordUpdate(form.data.userId, form.data.newPassword, form.data.authorizationKey)
      throw redirect(302, '/')
    } catch (error) {
      message(form, { status: 'error', text: error.value })
    }

  }
}