export const prerender = false
import { json } from '@sveltejs/kit'
import {
  deleteCivilization,
  getMyCivilizations,
  reclaimCivilizationResources,
} from '../../services/api/civilization-api.js'

export async function DELETE({ cookies, request }) {
  const { civilizationId } = await request.json()
  await deleteCivilization(cookies.get('auth') ?? '', civilizationId)
  return json({}, { status: 200 })
}

export async function POST({ cookies, request }) {
  const { civilizationId, targetCivilizationId } = await request.json()
  try {
    const result = await reclaimCivilizationResources(
      cookies.get('auth') ?? '',
      civilizationId,
      targetCivilizationId,
    )
    return json(result ?? {}, { status: 200 })
  } catch (error) {
    const message =
      (error as { value?: { error?: string } })?.value?.error ??
      (error instanceof Error ? error.message : 'Erreur lors de la récupération des ressources')
    return json({ error: message }, { status: 400 })
  }
}


export async function GET({ cookies }) {
  return json({ myCivilizations: await getMyCivilizations(cookies.get('auth') ?? '') }, { status: 200 })
}