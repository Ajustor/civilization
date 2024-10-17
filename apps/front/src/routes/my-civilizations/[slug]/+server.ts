import { error, json } from '@sveltejs/kit'
import { getPeopleFromCivilizationPaginated } from '../../../services/api/people-api.js'

export const prerender = false

export async function GET({ cookies, url }) {
  const civilizationId = url.searchParams.get('civilizationId') ?? ''
  const page = +(url.searchParams.get('page') ?? '0')
  const count = +(url.searchParams.get('count') ?? '10')

  if (!civilizationId) {
    error(400, 'No civilization id pass')
  }

  const people = await getPeopleFromCivilizationPaginated(cookies.get('auth') ?? '', civilizationId, { page, count })

  return json({ people }, { status: 200 })
}
