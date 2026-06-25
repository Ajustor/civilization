import { client } from './client'

type ResourceAmount = { resourceType: string; quantity: number }

export const getWorldTradeOffers = async (authToken: string, worldId: string) => {
	const { data, error } = await client.worlds({ worldId })['trade-offers'].get({
		headers: { authorization: `Bearer ${authToken}` },
	})
	if (error) {
		console.error(error)
		throw error
	}
	return data
}

export const createTradeOffer = async (
	authToken: string,
	civilizationId: string,
	body: { worldId: string; toCivilizationId?: string | null; give: ResourceAmount[]; want: ResourceAmount[] },
) => {
	const { error } = await client.civilizations({ civilizationId })['trade-offers'].post(body, {
		headers: { authorization: `Bearer ${authToken}` },
	})
	if (error) {
		console.error(error)
		throw error
	}
}

export const acceptTradeOffer = async (
	authToken: string,
	offerId: string,
	civilizationId: string,
) => {
	const { error } = await client['trade-offers']({ offerId }).accept.post(
		{ civilizationId },
		{ headers: { authorization: `Bearer ${authToken}` } },
	)
	if (error) {
		console.error(error)
		throw error
	}
}

export const cancelTradeOffer = async (authToken: string, offerId: string) => {
	const { error } = await client['trade-offers']({ offerId }).delete(
		{},
		{ headers: { authorization: `Bearer ${authToken}` } },
	)
	if (error) {
		console.error(error)
		throw error
	}
}
