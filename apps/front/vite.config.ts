import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type PluginOption } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { enhancedImages } from '@sveltejs/enhanced-img'
import { fileURLToPath, URL } from 'node:url'

// The `sveltekit-superforms/adapters` barrel eagerly evaluates every adapter,
// including the TypeBox one, which throws "Class extends value undefined" with
// the installed typebox and 500s every form page. We only use Zod, so alias the
// barrel to the Zod (v4) adapter module directly — this bypasses the barrel and
// still lets Vite pre-bundle its deps (avoiding the memoize-weak CJS interop
// error a relative import would cause).
const superformsZodAdapter = fileURLToPath(
	new URL(
		'./node_modules/sveltekit-superforms/dist/adapters/zod4.js',
		import.meta.url,
	),
)

const generateSW = process.env.GENERATE_SW === 'true'

const plugins = [
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
	resolve: {
		alias: {
			'sveltekit-superforms/adapters': superformsZodAdapter,
		},
	},
	// PostCSS config is auto-discovered from postcss.config.cjs. Setting
	// css.postcss to an inline object here ({ config: ... }) made vite treat it
	// as an inline config with no plugins, so Tailwind never ran.
	plugins
})
