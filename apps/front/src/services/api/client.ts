// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@ajustor/civ-api'

const BACK_URL = process.env.BACK_URL ?? 'http://localhost:3000'

export const client = treaty<App>(BACK_URL, {
  fetch: {
    credentials: 'include'
  }
})
