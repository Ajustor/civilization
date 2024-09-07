<script lang="ts">
	import { page } from '$app/stores'
	import logo from '$lib/images/logo.png'
	import { Link, Navbar, Segmented, SegmentedButton } from 'konsta/svelte'
	import { useUser, type User } from '../stores/user'

	export let user: User | null | undefined
</script>

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
	<Segmented slot="title" activeButtonIndex={0}>
		<SegmentedButton strong active={$page.url.pathname === '/rules'} href="/rules">
			Les règles de la simulation
		</SegmentedButton>

		{#if user?.id}
			<SegmentedButton
				strong
				active={$page.url.pathname.includes('/my-civilizations')}
				href="/my-civilizations"
			>
				Mes civilisations
			</SegmentedButton>
		{/if}
	</Segmented>
</Navbar>

<style>
</style>
