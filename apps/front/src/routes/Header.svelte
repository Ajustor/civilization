<script lang="ts">
	import { page } from '$app/stores'
	import logo from '$lib/images/logo.png'
	import {
		Link,
		List,
		ListItem,
		Navbar,
		Page,
		Panel,
		Segmented,
		SegmentedButton
	} from 'konsta/svelte'
	import { type User } from '../stores/user'
	import { useMediaQuery } from 'svelte-breakpoints'
	import type { Readable } from 'svelte/store'
	import { Menu } from 'lucide-svelte'

	export let user: User | null | undefined

	const routes: { url: string; label: string }[] = [
		{ url: '/rules', label: 'Les règles de la simulation' },
		{ url: '/my-civilizations', label: 'Mes civilisations' }
	]

	$: activeButtonIndex = routes.findIndex(({ url }) => $page.url.pathname.includes(url)) ?? -1

	const isMobile: Readable<boolean> = useMediaQuery('(max-width: 600px)')

	let isPanelOpen = false
</script>

{#if $isMobile}
	<Navbar>
		<Link class="p-4" slot="left" href="/" navbar>
			<img src={logo} class="w-24 min-w-24" alt="Logo du simulateur de civilisation" />
		</Link>
		<Link slot="right" onClick={() => (isPanelOpen = true)} navbar><Menu size="40" /></Link>
	</Navbar>
	<Panel side="right" opened={isPanelOpen} onBackdropClick={() => (isPanelOpen = false)}>
		<Page>
			<List>
				{#each routes as route}
					<ListItem href={route.url} title={route.label} onclick={() => (isPanelOpen = false)} />
				{/each}
				<ListItem
					href="/me"
					title={user?.id ? 'Mon compte' : 'Me connecter'}
					onclick={() => (isPanelOpen = false)}
				/>
			</List>
		</Page>
	</Panel>
{:else}
	<Navbar>
		<Link class="p-4" slot="left" href="/" navbar>
			<img src={logo} class="w-24" alt="Logo du simulateur de civilisation" />
		</Link>
		<Link slot="right" href="/me" navbar>
			{#if user?.id}
				<!-- content here -->
				Mon compte
			{:else}
				Me connecter
			{/if}
		</Link>
		<Segmented slot="title" {activeButtonIndex}>
			{#each routes as route}
				<SegmentedButton strong active={$page.url.pathname.includes(route.url)} href={route.url}>
					{route.label}
				</SegmentedButton>
			{/each}
		</Segmented>
	</Navbar>
{/if}

<style>
</style>
