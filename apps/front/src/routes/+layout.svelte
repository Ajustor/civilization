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
	import { App, Page } from 'konsta/svelte'

	export let data: LayoutData

	let userStore = useUser()

	userStore.value = data.user

	page.subscribe(({ error }) => {
		if (error) {
			toast.error(error.message)
		}
	})
</script>

<Toaster richColors />

<App safeAreas>
	<Page>
		<Header user={userStore.value} />
		<slot></slot>
	</Page>

	<!-- {#key data.url}
		<span
			class="h-full w-full"
			in:fly={{ delay: 300, x: -200, duration: 300 }}
			out:fly={{ duration: 300 }}
		>
			<slot></slot>
		</span>
	{/key} -->
</App>

<style>
</style>
