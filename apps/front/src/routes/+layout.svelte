<script lang="ts">
	import Header from './Header.svelte'
	import './styles.css'
	import '../app.pcss'
	import { useUser } from '../stores/user'
	import type { LayoutData } from './$types'

	export let data: LayoutData

	let userStore = useUser()
	if (data.user) {
		userStore.value = data.user
	}
</script>

<div class="app">
	<Header user={userStore.value} />

	<main>
		<slot></slot>
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
		justify-content: center;
		align-items: center;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
