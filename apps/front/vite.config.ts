import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type PluginOption } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { enhancedImages } from '@sveltejs/enhanced-img'
import { createRequire } from 'node:module'
import path from 'node:path'

// The `sveltekit-superforms/adapters` barrel eagerly evaluates every adapter,
// including the TypeBox one, which throws "Class extends value undefined" with
// the installed typebox and 500s every form page. We only use Zod, so alias the
// barrel to the Zod (v4) adapter module directly — this bypasses the barrel and
// still lets Vite pre-bundle its deps (avoiding the memoize-weak CJS interop
// error a relative import would cause).
// Resolve the package location at runtime (it may be hoisted to the workspace
// root or live in apps/front/node_modules depending on the install) so the
// alias works both locally and on the Vercel build.
const require = createRequire(import.meta.url)
// Resolve the exported `./adapters` entry (this only resolves the path, it does
// NOT evaluate the barrel, so the TypeBox crash isn't triggered) and take the
// sibling zod4.js. `./package.json` isn't exported, so we can't resolve that.
const superformsZodAdapter = path.join(
	path.dirname(require.resolve('sveltekit-superforms/adapters')),
	'zod4.js',
)

// Par défaut on utilise la stratégie `injectManifest` (notre `prompt-sw.ts`,
// qui contient le precache Workbox ET les handlers push/notificationclick).
// `generateSW` (Workbox auto, SANS handler push) reste disponible explicitement
// via `GENERATE_SW=true` (script `build-generate`). Sans handler push embarqué,
// les notifications ne s'affichent jamais — d'où ce défaut.
const generateSW = process.env.GENERATE_SW === 'true'

// The `sveltekit-superforms/adapters` barrel eagerly evaluates EVERY adapter,
// including the TypeBox one, which throws at build time. This plugin intercepts
// that import and redirects it to the zod4.js adapter module directly (which
// exports `zod` and `zodClient`), re-exporting them under the versioned names
// `zod4` and `zod4Client` that the codebase uses (matching the barrel's type
// declarations so TypeScript stays happy).
const superformsAdaptersPlugin = (zod4Path: string): import('vite').Plugin => ({
  name: 'superforms-adapters-compat',
  enforce: 'pre',
  resolveId(id) {
    if (id === 'sveltekit-superforms/adapters') return '\0superforms-adapters'
  },
  load(id) {
    if (id === '\0superforms-adapters') {
      const p = zod4Path.replace(/\\/g, '/')
      return `export { zod as zod4, zodClient as zod4Client, zod, zodClient, zodToJSONSchema } from '${p}'`
    }
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugins: any[] = [
	superformsAdaptersPlugin(superformsZodAdapter),
	visualizer({ filename: 'stats.html', emitFile: true }) as PluginOption,
	sveltekit(),
	SvelteKitPWA({
		srcDir: './src',
		strategies: generateSW ? 'generateSW' : 'injectManifest',
		// you don't need to do this if you're using generateSW strategy in your app
		filename: generateSW ? undefined : 'prompt-sw.ts',
		manifest: {
			short_name: 'Civilisations',
			name: 'Civilisations',
			start_url: '/',
			scope: '/',
			display: 'standalone',
			theme_color: "#ffffff",
			background_color: "#ffffff",
			icons: [
				{
					src: '/favicon.png',
					sizes: '512x512',
					type: 'image/png',
				},
			],
		},
		injectManifest: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
		},
		workbox: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
		},
		devOptions: {
			enabled: true,
			suppressWarnings: process.env.SUPPRESS_WARNING === 'true',
			type: 'module',
			navigateFallback: '/',
		},
		// if you have shared info in svelte config file put in a separate module and use it also here
		kit: {
			includeVersionFile: true,
		}
	}),
]

if (process.env.ENVIRONMENT === 'prod') {
	plugins.push(enhancedImages())
}

export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: 8080,
	},
	build: {
		minify: true,
	},
	define: {
		__DATE__: `'${new Date().toISOString()}'`,
		__RELOAD_SW__: false,
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
	},
	resolve: {},
	ssr: {
		noExternal: ['sveltekit-superforms'],
	},
	// PostCSS config is auto-discovered from postcss.config.cjs. Setting
	// css.postcss to an inline object here ({ config: ... }) made vite treat it
	// as an inline config with no plugins, so Tailwind never ran.
	plugins
})
