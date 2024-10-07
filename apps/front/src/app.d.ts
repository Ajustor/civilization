import 'vite-plugin-pwa/svelte'
import 'vite-plugin-pwa/info'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {

	declare const __DATE__: string
	declare const __RELOAD_SW__: boolean

	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			flash?: { type: 'success' | 'error' | 'loading' | 'info'; message: string }
		}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			userid: string
			buildDate: string
			periodicUpdates: boolean
		}
	}
}

export { }
