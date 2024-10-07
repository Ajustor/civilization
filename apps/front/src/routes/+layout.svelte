<script lang="ts">
	import Header from './Header.svelte'
	import './styles.css'
	import '../app.pcss'
	import { useUser } from '../stores/user'
	import type { LayoutData } from './$types'
	import { Toaster } from '$lib/components/ui/sonner'
	import { fly } from 'svelte/transition'
	import { page } from '$app/stores'
	import { toast } from 'svelte-sonner'
	import { onMount } from 'svelte'
//	import { pwaInfo } from 'virtual:pwa-info'

	export let data: LayoutData

	let userStore = useUser()

	userStore.value = data.user

	page.subscribe(({ error }) => {
		if (error) {
			toast.error(error.message)
		}
	})

/*	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register')
			registerSW({
				immediate: true,
				onRegistered(r: unknown) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`)
				},
				onRegisterError(error: unknown) {
					console.log('SW registration error', error)
				}
			})
		}
	})*/

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : ''
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<Toaster richColors />

<div class="app">
	<Header user={userStore.value} />

	<main>
		{#key data.url}
			<span
				class="h-full w-full"
				in:fly={{ delay: 300, x: -200, duration: 300 }}
				out:fly={{ duration: 300 }}
			>
				<slot></slot>
			</span>
		{/key}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
		align-items: center;
	}
</style>
