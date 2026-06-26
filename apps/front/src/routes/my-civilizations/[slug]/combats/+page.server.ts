export const prerender = false

import { getCombatLogs, getMyCivilizationFromId } from '../../../../services/api/civilization-api'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const PAGE_SIZE = 20

export const load: PageServerLoad = async ({ cookies, params, url }) => {
  const civilization = await getMyCivilizationFromId(
    cookies.get('auth') ?? '',
    params.slug,
  ).catch(() => null)

  if (!civilization) {
    redirect(302, '/')
  }

  const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'))
  const logs = await getCombatLogs(
    cookies.get('auth') ?? '',
    params.slug,
    PAGE_SIZE,
    page * PAGE_SIZE,
  ).catch(() => [])

  return {
    civilization,
    logs,
    page,
    pageSize: PAGE_SIZE,
    slug: params.slug,
  }
}
