import { treaty } from '@elysiajs/eden'
import type { App } from '@ajustor/civ-api'
import { BACK_URL } from '$env/static/public'

export const client = treaty<App>(BACK_URL, {
  fetch: {
    credentials: 'include'
  }
})
