import { client } from './client'
import type { PushSubscriptionDtoType } from '@ajustor/civ-api'

export const getVapidPublicKey = async (): Promise<string> => {
	const { data, error } = await client.push['public-key'].get()

	if (error) {
		console.error(error)
		throw error
	}

	return data.publicKey
}

export const subscribeToPush = async (
	authToken: string,
	subscription: PushSubscriptionDtoType
) => {
	const { error } = await client.push.register.post(subscription, {
		headers: {
			authorization: `Bearer ${authToken}`
		}
	})

	if (error) {
		console.error(error)
		throw error
	}
}

export const unsubscribeFromPush = async (authToken: string, endpoint: string) => {
	const { error } = await client.push.unregister.post(
		{ endpoint },
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
