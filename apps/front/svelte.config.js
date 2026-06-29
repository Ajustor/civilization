import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
// Doit rester cohérent avec vite.config.ts : par défaut on utilise injectManifest
// (prompt-sw.ts compilé par SvelteKit en service worker, avec handlers push), et
// generateSW n'est activé qu'explicitement via GENERATE_SW=true.
const generateSW = process.env.GENERATE_SW === 'true'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess({})],

	kit: {
		// Node adapter: produces a standalone server (build/index.js) served by Bun
		// inside a Docker container on Dokploy.
		// See https://svelte.dev/docs/kit/adapter-node
		adapter: adapter(),
		serviceWorker: {
			register: false
		},
		files: {
			serviceWorker: generateSW ? undefined : 'src/prompt-sw.ts'
		}
	}
}

export default config
