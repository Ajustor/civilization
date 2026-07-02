export const prerender = false

import { fail, message, superValidate } from 'sveltekit-superforms'
import {
	getMyCivilizationFromId,
	getMyCivilizations,
	updateCivilization
} from '../../../../services/api/civilization-api'
import type { Actions, PageServerLoad } from './$types'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import { civilizationConfigSchema } from '$lib/schemas/civilizationConfig'
import { error, redirect } from '@sveltejs/kit'
import { DEFAULT_OCCUPATION_DISTRIBUTION, type CivilizationType } from '@ajustor/simulation'

// Merge the stored distribution over the defaults so every occupation key is present
// (the form requires all of them, and civs saved before the migration have none).
// Si le total ne fait plus 100 (ex. répartition enregistrée avant l'ajout du
// métier Constructeur), on repart de la répartition par défaut — même
// comportement que la simulation (sanitizeOccupationDistribution).
const resolveDistribution = (stored?: Record<string, number>) => {
	const merged = { ...DEFAULT_OCCUPATION_DISTRIBUTION, ...(stored ?? {}) }
	const total = Object.values(merged).reduce((sum, value) => sum + (value ?? 0), 0)
	return total === 100 ? merged : { ...DEFAULT_OCCUPATION_DISTRIBUTION }
}

export const load: PageServerLoad = async ({ cookies, params }) => {
	const auth = cookies.get('auth') ?? ''

	const civilization = await getMyCivilizationFromId(auth, params.slug).catch((error) =>
		console.error('An error occured', error)
	)

	if (!civilization) {
		redirect(302, '/my-civilizations')
	}

	const myCivilizations = await getMyCivilizations(auth).catch(
		() => [] as Awaited<ReturnType<typeof getMyCivilizations>>
	)

	// Échanges : uniquement ses propres autres civilisations DU MÊME MONDE
	// (la simulation n'échange qu'au sein d'un monde).
	const otherCivilizations = (myCivilizations as CivilizationType[])
		.filter((other) => other.id !== civilization.id && other.worldId === civilization.worldId)
		.map((other) => ({ id: other.id, name: other.name }))

	const configForm = await superValidate(
		{
			maximumChildrenPercentage: civilization.config.MAXIMUM_CHILDREN_PERCENTAGE,
			maxActivePeopleByCivilization: civilization.config.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION,
			openExchange: civilization.config.OPEN_EXCHANGE ?? [],
			militaryRatio: civilization.config.MILITARY_RATIO,
			atWarWith: civilization.config.AT_WAR_WITH ?? [],
			nextBuildingToBuild: civilization.config.NEXT_BUILDING_TO_BUILD ?? null,
			speedMode: civilization.config.SPEED_MODE ?? true,
			occupationDistribution: resolveDistribution(civilization.config.OCCUPATION_DISTRIBUTION)
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
				maximumChildrenPercentage: form.data.maximumChildrenPercentage,
				maxActivePeopleByCivilization: form.data.maxActivePeopleByCivilization,
				openExchange: form.data.openExchange,
				militaryRatio: form.data.militaryRatio,
				atWarWith: form.data.atWarWith,
				nextBuildingToBuild: form.data.nextBuildingToBuild,
				speedMode: form.data.speedMode,
				occupationDistribution: form.data.occupationDistribution
			})

			// Re-read so the form reflects exactly what was persisted (avoids showing
			// stale/default values after submit).
			const updated = await getMyCivilizationFromId(cookies.get('auth') ?? '', params.slug).catch(
				() => null
			)
			const persistedForm = updated
				? await superValidate(
						{
							maximumChildrenPercentage: updated.config.MAXIMUM_CHILDREN_PERCENTAGE,
							maxActivePeopleByCivilization: updated.config.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION,
							openExchange: updated.config.OPEN_EXCHANGE ?? [],
							militaryRatio: updated.config.MILITARY_RATIO,
							atWarWith: updated.config.AT_WAR_WITH ?? [],
							nextBuildingToBuild: updated.config.NEXT_BUILDING_TO_BUILD ?? null,
							speedMode: updated.config.SPEED_MODE ?? true,
							occupationDistribution: resolveDistribution(updated.config.OCCUPATION_DISTRIBUTION)
						},
						zod(civilizationConfigSchema)
					)
				: form

			message(persistedForm, { status: 'success', text: 'La configuration a bien été mise à jour' })
			return { form: persistedForm }
		} catch (requestError) {
			error(requestError.status ?? 500, requestError.value ?? 'Une erreur est survenue')
		}
	}
} satisfies Actions
