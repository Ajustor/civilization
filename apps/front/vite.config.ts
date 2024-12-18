import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type PluginOption } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { enhancedImages } from '@sveltejs/enhanced-img'

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
	plugins
})
