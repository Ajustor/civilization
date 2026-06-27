export const prerender = false

import { getCemetery, getMyCivilizationFromId } from '../../../../services/api/civilization-api'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const PAGE_SIZE = 30

export const load: PageServerLoad = async ({ cookies, params, url }) => {
  const civilization = await getMyCivilizationFromId(
    cookies.get('auth') ?? '',
    params.slug,
  ).catch(() => null)

  if (!civilization) {
    redirect(302, '/')
  }

  const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'))
  const cemetery = await getCemetery(
    cookies.get('auth') ?? '',
    params.slug,
    PAGE_SIZE,
    page * PAGE_SIZE,
  ).catch(() => null)

  return {
    civilization,
    cemetery,
    page,
    pageSize: PAGE_SIZE,
    slug: params.slug,
  }
}
