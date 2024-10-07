import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type PluginOption } from 'vite'
import { enhancedImages } from '@sveltejs/enhanced-img'
import { visualizer } from 'rollup-plugin-visualizer'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'

export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: 8080,
	},
	build: {
		minify: true,
	},
	plugins: [
		visualizer({ filename: 'stats.html', emitFile: true }) as PluginOption,
		enhancedImages(),
		sveltekit(),
		SvelteKitPWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'my-sw.js',
		}),
	]
})
