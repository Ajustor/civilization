import { json } from '@sveltejs/kit'
import { getPeopleFromCivilizationPaginated } from '../../../../services/api/people-api.js'

export const prerender = false

// Dedicated JSON endpoint for paginated citizens. Lives on its own route (no
// sibling +page) so it always returns JSON — unlike the parent /[slug] route,
// where a +page and a +server compete via content negotiation.
export async function GET({ cookies, params, url }) {
  const page = +(url.searchParams.get('page') ?? '0')
  const count = +(url.searchParams.get('count') ?? '10')
  const sortField = url.searchParams.get('sortField')
  const sortOrder = url.searchParams.get('sortOrder')
  const sort = sortField && sortOrder ? { field: sortField, order: sortOrder as 'asc' | 'desc' } : undefined

  const people = await getPeopleFromCivilizationPaginated(cookies.get('auth') ?? '', params.slug, {
    page,
    count,
    sort,
  })

  return json({ people }, { status: 200 })
}
