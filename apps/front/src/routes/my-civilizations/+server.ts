import { json } from '@sveltejs/kit'
import { deleteCivilization, getMyCivilizations } from '../../services/api/civilization-api.js'

export async function DELETE({ cookies, request }) {
  const { civilizationId } = await request.json()
  await deleteCivilization(cookies, civilizationId)
  return json({}, { status: 200 })
}


export async function GET({ cookies }) {
  return json({ myCivilizations: await getMyCivilizations(cookies) }, { status: 200 })
}