import { error } from '@sveltejs/kit'
import { getPeopleStreamFromCivilization } from '../../../../services/api/people-api.js'

export const prerender = false

export async function GET({ cookies, url }) {
  const civilizationId = url.searchParams.get('civilizationId') ?? ''

  if (!civilizationId) {
    error(400, 'No civilization id pass')
  }

  const stream = await getPeopleStreamFromCivilization(cookies.get('auth') ?? '', civilizationId)

  // Retourner directement le stream
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}
