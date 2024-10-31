import { client } from './client'

export const getMyCivilizations = async (authToken: string) => {
	const { data: civilizationsInfos, error } = await client.civilizations.mine.get({
		headers: {
			authorization: `Bearer ${authToken}`
		}
	})

	if (error) {
		console.error(error)
		throw error
	}

	return civilizationsInfos.civilizations
}

export const getMyCivilizationFromId = async (authToken: string, civilizationId: string) => {
	const { data: civilizationInfos, error } = await client.civilizations({ civilizationId }).get({
		headers: {
			authorization: `Bearer ${authToken}`
		}
	})

	if (error) {
		console.error(error)
		throw error
	}

	return civilizationInfos.civilization
}

export const createCivilization = async (authToken: string, civilizationName: string) => {
	const { error } = await client.civilizations.post(
		{ name: civilizationName },
		{
			headers: {
				authorization: `Bearer ${authToken}`
			}
		}
	)

	if (error) {
		console.error(error)
		throw error
	}
}

export const deleteCivilization = async (authToken: string, civilizationId: string) => {
	const { error } = await client.civilizations({ civilizationId }).delete(
		{},
		{
			headers: {
				authorization: `Bearer ${authToken}`
			}
		}
	)

	if (error) {
		console.error(error)
		throw error
	}
}

export const getCivilizationStats = async (authToken: string, civilizationId: string) => {
	const { data: stats, error } = await client.civilizations({ civilizationId }).stats.get({
		headers: {
			authorization: `Bearer ${authToken}`
		}
	})

	if (error) {
		console.error(error)
		throw error
	}

	return stats
}
