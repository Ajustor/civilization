import { client } from './client'
import type { UpdateCivilizationDtoType } from '@ajustor/civ-api'

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

export const createCivilization = async (authToken: string, civilizationName: string, worldId?: string) => {
	const { error } = await client.civilizations.post(
		{ name: civilizationName, ...(worldId ? { worldId } : {}) },
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

export const updateCivilization = async (authToken: string, civilizationId: string, body: UpdateCivilizationDtoType) => {
	const { error } = await client.civilizations({ civilizationId }).patch(
		body,
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

export const getCivilizationWorld = async (authToken: string, civilizationId: string): Promise<string | null> => {
	const { data, error } = await client.civilizations({ civilizationId }).world.get({
		headers: { authorization: `Bearer ${authToken}` }
	})

	if (error) {
		console.error(error)
		throw error
	}

	return data.worldId
}

export const getCombatLogs = async (
  authToken: string,
  civilizationId: string,
  limit = 20,
  offset = 0,
) => {
  const { data, error } = await client
    .civilizations({ civilizationId })
    ['combat-logs'].get({
      headers: { authorization: `Bearer ${authToken}` },
      query: { limit, offset },
    })

  if (error) {
    console.error(error)
    throw error
  }

  return data.logs
}

export const getCemetery = async (
  authToken: string,
  civilizationId: string,
  limit = 20,
  offset = 0,
) => {
  const { data, error } = await client
    .civilizations({ civilizationId })
    .cemetery.get({
      headers: { authorization: `Bearer ${authToken}` },
      query: { limit, offset },
    })

  if (error) {
    console.error(error)
    throw error
  }

  return data
}

export const reclaimCivilizationResources = async (
  authToken: string,
  civilizationId: string,
  targetCivilizationId: string,
) => {
  const { data, error } = await client
    .civilizations({ civilizationId })
    .reclaim.post(
      { targetCivilizationId },
      {
        headers: { authorization: `Bearer ${authToken}` },
      },
    )

  if (error) {
    console.error(error)
    throw error
  }

  return data
}

export const colonizeCivilization = async (
  authToken: string,
  civilizationId: string,
  body: {
    colonyName: string
    populationPercent: number
    resources: { type: string; amount: number }[]
    techs: string[]
  },
) => {
  const { data, error } = await client
    .civilizations({ civilizationId })
    .colonize.post(body, {
      headers: { authorization: `Bearer ${authToken}` },
    })

  if (error) {
    console.error(error)
    throw error
  }

  return data
}
