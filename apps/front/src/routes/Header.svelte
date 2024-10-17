<script lang="ts">
	import { page } from '$app/stores'
	import logo from '$lib/images/logo.webp?enhanced'
	import { type User } from '../stores/user'
	import { injectSpeedInsights } from '@vercel/speed-insights'

	injectSpeedInsights()
	export let user: User | null | undefined

	const routes: { url: string; label: string }[] = [
		{ url: '/rules', label: 'Les règles de la simulation' },
		{ url: '/my-civilizations', label: 'Mes civilisations' }
	]
</script>

<header>
	<nav class="navbar justify-between">
		<a class="navbar-start max-w-24 p-4" href="/">
			<enhanced:img src={logo} sizes="min(64px, 100%)" alt="Logo du simulateur de civilisation" />
		</a>
		<ul class="navbar-end hidden lg:flex">
			{#each routes as route}
				<li class:active={$page.url.pathname.includes(route.url)}>
					<a class="btn" href={route.url}>
						{route.label}
					</a>
				</li>
			{/each}
			<li class:active={$page.url.pathname.includes('/me')}>
				<a href="/me" class="btn min-w-20">
					{#if user?.id}
						<!-- content here -->
						Mon compte
					{:else}
						Me connecter
					{/if}
				</a>
			</li>
		</ul>
		<div class="dropdown dropdown-end navbar-end w-auto lg:hidden">
			<div tabindex="0" role="button" class="btn btn-ghost">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h8m-8 6h16"
					/>
				</svg>
			</div>
			<ul
				tabindex="-1"
				class="menu menu-sm dropdown-content bg-base-200 rounded-box z-[1] mt-3 w-52 p-2 shadow"
			>
				{#each routes as route}
					<li aria-current={$page.url.pathname.includes(route.url) ? 'page' : null}>
						<a class="btn" href={route.url}>
							{route.label}
						</a>
					</li>
				{/each}
				<li aria-current={$page.url.pathname.includes('/me') ? 'page' : null}>
					<a href="/me" class="btn navbar-end w-full text-center">
						{#if user?.id}
							<!-- content here -->
							Mon compte
						{:else}
							Me connecter
						{/if}
					</a>
				</li>
			</ul>
		</div>
	</nav>
</header>

<style>
	header {
		@apply bg-base-200;
	}

	li[aria-current='page'] {
		text-decoration: underline;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
