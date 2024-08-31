// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@ajustor/civ-api'
import { BACK_URL } from '$env/static/private'

export const client = treaty<App>(BACK_URL, {
  fetch: {
    credentials: 'include'
  }
})
