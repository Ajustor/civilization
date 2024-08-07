// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@ajustor/civ-api'

export const client = treaty<App>('localhost:3000')

