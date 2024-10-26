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
	import { pwaInfo } from 'virtual:pwa-info'
	import { partytownSnippet } from '@builder.io/partytown/integration'

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : ''

	export let data: LayoutData

	let userStore = useUser()

	userStore.value = data.user

	page.subscribe(({ error }) => {
		if (error) {
			toast.error(error.message)
		}
	})
</script>

<!-- svelte-ignore reactive_declaration_non_reactive_property -->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifest}
	{@html '<script>' + partytownSnippet() + '</script>'}
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
