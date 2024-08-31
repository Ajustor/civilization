<script lang="ts">
	import { useUser, type User } from '../../stores/user'
	import type { PageData } from './$types'
	import LoginForm from './login.svelte'
	export let data: PageData

	const userStore = useUser()

	if (data.isLogged && data.user?.id) {
		userStore.value = data.user
	}
</script>

{#if !data.isLogged}
	<!-- content here -->
	<LoginForm data={data.loginForm} />
{:else}
	<!-- else content here -->
	<p>Bonsoir {userStore.value?.username}</p>
{/if}
