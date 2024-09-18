import { treaty } from '@elysiajs/eden'
import type { App } from '@ajustor/civ-api'
import { PUBLIC_BACK_URL } from '$env/static/public'

export const client = treaty<App>(PUBLIC_BACK_URL, {
  fetch: {
    credentials: 'include'
  }
})
