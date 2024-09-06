import { json } from '@sveltejs/kit'
import { askPasswordLink } from '../../services/api/user-api.js'

export async function POST({ request }) {
  const { email } = await request.json()
  await askPasswordLink(email)
  return json({}, { status: 200 })
}
