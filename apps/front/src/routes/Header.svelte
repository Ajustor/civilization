<script lang="ts">
	import { page } from '$app/state'
	import { type User } from '../stores/user'

	interface Props {
		user: User | null | undefined;
	}

	let { user }: Props = $props()

	const navLinks = [
		{ url: '/', label: 'Les mondes', match: (p: string) => p === '/' || p.startsWith('/worlds') },
		{ url: '/my-civilizations', label: 'Mes civilisations', match: (p: string) => p.startsWith('/my-civilizations') },
		{ url: '/rules', label: 'Les règles', match: (p: string) => p.startsWith('/rules') }
	]

	let menuOpen = $state(false)
</script>

<header style="position:sticky; top:0; z-index:20; display:flex; flex-wrap:wrap; align-items:center; gap:18px; padding:14px clamp(16px,3vw,36px); background:oklch(0.93 0.025 80 / 0.9); backdrop-filter:blur(10px); border-bottom:1px solid oklch(0.76 0.05 60); animation:navIn .5s cubic-bezier(.22,.72,.2,1) both;">
	<!-- Brand -->
	<a href="/" aria-label="Accueil" style="display:flex; align-items:center; gap:12px; text-decoration:none;">
		<div style="width:40px; height:40px; border-radius:50%; background:radial-gradient(circle at 35% 30%, oklch(0.55 0.14 38), oklch(0.4 0.13 34)); color:oklch(0.94 0.03 84); display:flex; align-items:center; justify-content:center; font-family:'Marcellus',serif; font-size:21px; box-shadow:inset 0 1px 4px rgba(255,220,180,.4);">V</div>
		<span style="font-family:'Marcellus',serif; font-size:22px; color:oklch(0.32 0.04 40); letter-spacing:.02em;">Civilizations</span>
	</a>

	<!-- Desktop nav -->
	<nav style="display:flex; gap:22px; margin-left:8px;" class="desktop-nav">
		{#each navLinks as link}
			{@const active = link.match(page.url.pathname)}
			<a
				href={link.url}
				style="background:none; border:none; cursor:pointer; font-family:'Marcellus',serif; font-size:17px; text-decoration:none; padding:4px 2px; color:{active ? 'oklch(0.4 0.12 34)' : 'oklch(0.44 0.03 45)'}; border-bottom:{active ? '2px solid oklch(0.5 0.13 34)' : '2px solid transparent'};"
			>{link.label}</a>
		{/each}
	</nav>

	<div style="flex:1;"></div>

	<!-- User info (desktop) -->
	{#if user?.id}
		<div style="display:flex; align-items:center; gap:14px;" class="desktop-user">
			<span style="font-size:16px; color:oklch(0.48 0.03 50);">{user.username ?? user.email}</span>
			<a href="/me" style="background:none; border:1px solid oklch(0.74 0.05 60); border-radius:4px; padding:7px 14px; cursor:pointer; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.45 0.06 40); text-decoration:none;">Mon compte</a>
		</div>
	{:else}
		<a href="/login" style="background:none; border:1px solid oklch(0.74 0.05 60); border-radius:4px; padding:7px 14px; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.45 0.06 40); text-decoration:none;" class="desktop-user">Se connecter</a>
	{/if}

	<!-- Mobile hamburger -->
	<button
		onclick={() => menuOpen = !menuOpen}
		style="display:none; background:none; border:none; cursor:pointer; padding:4px;"
		aria-label="Menu"
		class="mobile-menu-btn"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="oklch(0.44 0.03 45)" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
		</svg>
	</button>

	<!-- Mobile dropdown -->
	{#if menuOpen}
		<div style="width:100%; border-top:1px solid oklch(0.76 0.05 60); padding-top:12px; display:flex; flex-direction:column; gap:10px;" class="mobile-nav">
			{#each navLinks as link}
				{@const active = link.match(page.url.pathname)}
				<a
					href={link.url}
					onclick={() => menuOpen = false}
					style="font-family:'Marcellus',serif; font-size:17px; text-decoration:none; padding:8px 4px; color:{active ? 'oklch(0.4 0.12 34)' : 'oklch(0.44 0.03 45)'}; border-bottom:1px solid oklch(0.86 0.03 76);"
				>{link.label}</a>
			{/each}
			{#if user?.id}
				<a href="/me" onclick={() => menuOpen = false} style="font-family:'EB Garamond',serif; font-size:16px; text-decoration:none; padding:8px 4px; color:oklch(0.45 0.06 40);">{user.username ?? user.email} · Mon compte</a>
			{:else}
				<a href="/login" onclick={() => menuOpen = false} style="font-family:'EB Garamond',serif; font-size:16px; text-decoration:none; padding:8px 4px; color:oklch(0.45 0.06 40);">Se connecter</a>
			{/if}
		</div>
	{/if}
</header>

<style>
	@media (max-width: 640px) {
		.desktop-nav,
		.desktop-user {
			display: none !important;
		}
		.mobile-menu-btn {
			display: flex !important;
		}
	}
</style>
