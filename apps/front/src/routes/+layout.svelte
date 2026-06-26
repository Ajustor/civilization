<script lang="ts">
	import Header from './Header.svelte'
	import './styles.css'
	import '../app.pcss'
	import { useUser } from '../stores/user'
	import type { LayoutData } from './$types'
	import { Toaster } from '$lib/components/ui/sonner'
	import { page } from '$app/state'
	import { toast } from 'svelte-sonner'
	import { pwaInfo } from 'virtual:pwa-info'

	let webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '')

	let { data, children } = $props()

	let userStore = useUser()

	$effect(() => {
		userStore.value = data.user
	})

	const authRoutes = ['/login', '/register', '/i-forgot']
	let isAuthPage = $derived(authRoutes.some((r) => page.url.pathname.startsWith(r)))

	$effect(() => {
		const { error } = page
		if (error) {
			toast.error(error.message)
		}
	})
</script>

<!-- svelte-ignore reactive_declaration_non_reactive_property -->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifest}
</svelte:head>

<Toaster />

<div class="app">
	{#if !isAuthPage}
		<Header user={userStore.value} />
	{/if}

	<main class:auth-main={isAuthPage}>
		{@render children()}
	</main>
</div>

{#await import('$lib/components/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await}

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
	}

	main {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}
</style>
