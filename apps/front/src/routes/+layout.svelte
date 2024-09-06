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
	import { useState } from '../stores/state'

	export let data: LayoutData

	let userStore = useUser()
	if (data.user) {
		userStore.value = data.user
	}

	page.subscribe(({ error }) => {
		if (error) {
			toast.error(error.message)
		}
	})
</script>

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

	<footer></footer>
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
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
