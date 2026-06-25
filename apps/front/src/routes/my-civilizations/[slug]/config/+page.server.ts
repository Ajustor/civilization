export const prerender = false

import { fail, message, superValidate } from 'sveltekit-superforms'
import {
	getMyCivilizationFromId,
	getMyCivilizations,
	updateCivilization
} from '../../../../services/api/civilization-api'
import type { Actions, PageServerLoad } from './$types'
import { zod } from 'sveltekit-superforms/adapters'
import { civilizationConfigSchema } from '$lib/schemas/civilizationConfig'
import { error, redirect } from '@sveltejs/kit'
import type { CivilizationType } from '@ajustor/simulation'

export const load: PageServerLoad = async ({ cookies, params }) => {
	const auth = cookies.get('auth') ?? ''

	const civilization = await getMyCivilizationFromId(auth, params.slug).catch((error) =>
		console.error('An error occured', error)
	)

	if (!civilization) {
		redirect(302, '/my-civilizations')
	}

	const myCivilizations = await getMyCivilizations(auth).catch(() => [])

	// Other civilizations the player owns are the candidates to open exchange with.
	const otherCivilizations = (myCivilizations as CivilizationType[])
		.filter((other) => other.id !== civilization.id)
		.map((other) => ({ id: other.id, name: other.name }))

	const configForm = await superValidate(
		{
			maximumChildren: civilization.config.MAXIMUM_CHILDREN,
			maxActivePeopleByCivilization: civilization.config.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION,
			openExchange: civilization.config.OPEN_EXCHANGE ?? [],
			militaryRatio: civilization.config.MILITARY_RATIO,
			atWarWith: civilization.config.AT_WAR_WITH ?? [],
			nextBuildingToBuild: civilization.config.NEXT_BUILDING_TO_BUILD ?? null
		},
		zod(civilizationConfigSchema)
	)

	return {
		civilization,
		otherCivilizations,
		configForm
	}
}

export const actions: Actions = {
	updateConfig: async ({ cookies, params, ...event }) => {
		const form = await superValidate({ cookies, params, ...event }, zod(civilizationConfigSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		try {
			await updateCivilization(cookies.get('auth') ?? '', params.slug, {
				maximumChildren: form.data.maximumChildren,
				maxActivePeopleByCivilization: form.data.maxActivePeopleByCivilization,
				openExchange: form.data.openExchange,
				militaryRatio: form.data.militaryRatio,
				atWarWith: form.data.atWarWith,
				nextBuildingToBuild: form.data.nextBuildingToBuild
			})

			message(form, { status: 'success', text: 'La configuration a bien été mise à jour' })
			return { form }
		} catch (requestError) {
			error(requestError.status ?? 500, requestError.value ?? 'Une erreur est survenue')
		}
	}
} satisfies Actions
