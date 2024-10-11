import { json } from '@sveltejs/kit'

export const prerender = false

export async function GET({ cookies, url }) {


  return json({}, { status: 200 })
}
