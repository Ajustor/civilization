import { json } from '@sveltejs/kit'
import { getCivilizationRecap } from '../../../../services/api/recap-api.js'

export const prerender = false

export async function GET({ cookies, params }) {
  const recap = await getCivilizationRecap(cookies.get('auth') ?? '', params.slug)
  return json(recap, { status: 200 })
}
