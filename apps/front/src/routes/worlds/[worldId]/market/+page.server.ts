export const prerender = false

import { error, fail, redirect } from '@sveltejs/kit'
import { getWorldTradeOffers } from '../../../../services/api/trade-offer-api'
import { getMyCivilizations } from '../../../../services/api/civilization-api'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies, params }) => {
	const auth = cookies.get('auth') ?? ''

	if (!auth) {
		redirect(302, '/login')
	}

	try {
		const [offers, myCivilizations] = await Promise.all([
			getWorldTradeOffers(auth, params.worldId),
			getMyCivilizations(auth),
		])

		return {
			offers: offers ?? [],
			myCivilizations: myCivilizations ?? [],
			worldId: params.worldId,
		}
	} catch (requestError: any) {
		error(requestError.status ?? 500, requestError.value ?? 'Une erreur est survenue')
	}
}

export const actions: Actions = {
	accept: async ({ cookies, request }) => {
		const auth = cookies.get('auth') ?? ''
		const data = await request.formData()
		const offerId = data.get('offerId') as string
		const civilizationId = data.get('civilizationId') as string

		try {
			const { acceptTradeOffer } = await import('../../../../services/api/trade-offer-api')
			await acceptTradeOffer(auth, offerId, civilizationId)
			return { success: true }
		} catch (requestError: any) {
			return fail(400, { message: requestError.value ?? 'Impossible d\'accepter l\'offre' })
		}
	},

	cancel: async ({ cookies, request }) => {
		const auth = cookies.get('auth') ?? ''
		const data = await request.formData()
		const offerId = data.get('offerId') as string

		try {
			const { cancelTradeOffer } = await import('../../../../services/api/trade-offer-api')
			await cancelTradeOffer(auth, offerId)
			return { success: true }
		} catch (requestError: any) {
			return fail(400, { message: requestError.value ?? 'Impossible d\'annuler l\'offre' })
		}
	},

	create: async ({ cookies, request }) => {
		const auth = cookies.get('auth') ?? ''
		const data = await request.formData()
		const civilizationId = data.get('civilizationId') as string
		const worldId = data.get('worldId') as string
		const toCivilizationId = (data.get('toCivilizationId') as string) || null
		const giveResource = data.get('giveResource') as string
		const giveQuantity = data.get('giveQuantity') as string
		const wantResource = data.get('wantResource') as string
		const wantQuantity = data.get('wantQuantity') as string

		const give = [{ resourceType: giveResource, quantity: Number(giveQuantity) }]
		const want = [{ resourceType: wantResource, quantity: Number(wantQuantity) }]

		try {
			const { createTradeOffer } = await import('../../../../services/api/trade-offer-api')
			await createTradeOffer(auth, civilizationId, {
				worldId,
				toCivilizationId,
				give,
				want,
			})
			return { success: true }
		} catch (requestError: any) {
			return fail(400, { message: requestError.value ?? 'Impossible de créer l\'offre' })
		}
	},
} satisfies Actions
