import { json } from '@sveltejs/kit'
import { unlockTechnology } from '../../../../services/api/tech-api.js'

export const prerender = false

export async function POST({ cookies, params, request }) {
  const { techId } = await request.json()
  const result = await unlockTechnology(cookies.get('auth') ?? '', params.slug, techId)
  return json(result, { status: 200 })
}
