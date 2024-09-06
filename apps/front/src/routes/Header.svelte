<script lang="ts">
	import { page } from '$app/stores'
	import logo from '$lib/images/logo.png'
	import { useUser, type User } from '../stores/user'

	export let user: User | null | undefined
</script>

<header>
	<div>
		<a href="/">
			<img src={logo} class="w-32" alt="Logo du simulateur de civilisation" />
		</a>
	</div>

	<nav>
		<ul>
			<li aria-current={$page.url.pathname === '/rules' ? 'page' : undefined}>
				<a href="/rules"> Les règles de la simulation </a>
			</li>
			{#if user?.id}
				<li aria-current={$page.url.pathname === '/my-civilizations' ? 'page' : undefined}>
					<a href="/my-civilizations"> Mes civilisations </a>
				</li>
			{/if}
			<li aria-current={$page.url.pathname === '/me' ? 'page' : undefined}>
				<a href="/me">
					{#if user?.id}
						<!-- content here -->
						Mon compte
					{:else}
						Me connecter
					{/if}
				</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
