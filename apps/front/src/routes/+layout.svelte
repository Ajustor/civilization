<script lang="ts">
	import Header from './Header.svelte'
	import './styles.css'
	import '../app.pcss'
	import { useUser } from '../stores/user'
	import type { LayoutData } from './$types'
	import { Toaster } from '$lib/components/ui/sonner'
	import { fly } from 'svelte/transition'
	import { page } from '$app/state'
	import { toast } from 'svelte-sonner'
	import { pwaInfo } from 'virtual:pwa-info'

	let webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '')

	let { data, children } = $props()

	let userStore = useUser()

	userStore.value = data.user

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

<Toaster richColors />

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
		min-height: 100vh;
	}

	main {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: 0;
	}

	:global(.page-trans) {
		position: absolute;
		inset: 0;
		overflow-y: auto;
	}
</style>
