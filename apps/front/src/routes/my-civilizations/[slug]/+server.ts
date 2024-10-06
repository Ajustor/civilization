import { json } from '@sveltejs/kit'
import { getPeopleFromCivilization } from '../../../services/api/people-api'

export const prerender = false

export async function GET({ cookies, url }) {
  const civilizationId = url.searchParams.get('civilizationId')
  if (!civilizationId) {
    throw new Error('No civilizationId found in query')
  }

  const { data: people, error } = await getPeopleFromCivilization(cookies.get('auth') ?? '', civilizationId)

  if (error) {
    throw error
  }

  return json({ people }, { status: 200 })
}
