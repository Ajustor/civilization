import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from './api/push-api'

export type PushState = 'unsupported' | 'denied' | 'enabled' | 'disabled'

export const isPushSupported = (): boolean =>
	typeof window !== 'undefined' &&
	'serviceWorker' in navigator &&
	'PushManager' in window &&
	'Notification' in window

/** Converts a base64url VAPID public key into the Uint8Array the API expects. */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

const getRegistration = async (): Promise<ServiceWorkerRegistration> =>
	(await navigator.serviceWorker.getRegistration()) ??
	(await navigator.serviceWorker.ready)

export const getPushState = async (): Promise<PushState> => {
	if (!isPushSupported()) {
		return 'unsupported'
	}
	if (Notification.permission === 'denied') {
		return 'denied'
	}

	const registration = await navigator.serviceWorker.getRegistration()
	const subscription = await registration?.pushManager.getSubscription()
	return subscription ? 'enabled' : 'disabled'
}

/**
 * Requests notification permission, subscribes the device through the
 * PushManager and registers the subscription on the backend.
 */
export const enablePush = async (authToken: string): Promise<PushState> => {
	if (!isPushSupported()) {
		return 'unsupported'
	}

	const permission = await Notification.requestPermission()
	if (permission !== 'granted') {
		return permission === 'denied' ? 'denied' : 'disabled'
	}

	const registration = await getRegistration()
	const publicKey = await getVapidPublicKey()
	if (!publicKey) {
		throw new Error('Les notifications push ne sont pas configurées sur le serveur.')
	}

	const subscription =
		(await registration.pushManager.getSubscription()) ??
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		}))

	await subscribeToPush(authToken, subscription.toJSON() as never)
	return 'enabled'
}

/** Removes the browser subscription and unregisters it on the backend. */
export const disablePush = async (authToken: string): Promise<PushState> => {
	if (!isPushSupported()) {
		return 'unsupported'
	}

	const registration = await navigator.serviceWorker.getRegistration()
	const subscription = await registration?.pushManager.getSubscription()

	if (subscription) {
		await unsubscribeFromPush(authToken, subscription.endpoint).catch((error) =>
			console.error(error)
		)
		await subscription.unsubscribe()
	}

	return 'disabled'
}
