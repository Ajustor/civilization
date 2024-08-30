<script lang="ts">
	import type { PageData } from './$types'
	import { user } from '../../stores/user.svelte'
	import { Button } from '$lib/components/ui/button'
	import LoginForm from './login.svelte'
	export let data: PageData
</script>

{#if !data.isLogged}
	<!-- content here -->
	<LoginForm data={data.loginForm} />
{/if}

<p>is user logged: {data.isLogged}</p>

<Button on:click={() => user.setUser('papayou')}>Add id to user</Button>
