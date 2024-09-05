import { json } from '@sveltejs/kit'
import { deleteCivilization } from '../../services/api/civilization-api.js'

export async function DELETE({ cookies, request }) {
  const { civilizationId } = await request.json()
  await deleteCivilization(cookies, civilizationId)
  return json({}, { status: 200 })
}
