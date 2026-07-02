<script lang="ts">
	import type { PageData } from './$types'
	import { ACHIEVEMENTS, ACHIEVEMENTS_MAX_SCORE } from '@ajustor/simulation'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'

	let { data }: { data: PageData } = $props()

	const unlockedById = $derived(
		new Map(data.unlockedAchievements.map((entry) => [entry.achievementId, entry]))
	)
	const unlockedCount = $derived(unlockedById.size)
	const progress = $derived(
		ACHIEVEMENTS_MAX_SCORE > 0 ? Math.round((data.score / ACHIEVEMENTS_MAX_SCORE) * 100) : 0
	)

	const formatDate = (value: string | Date | null | undefined) =>
		value
			? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
			: null
</script>

<svelte:head>
	<title>Succès de {data.civilization.name} — Civilizations</title>
</svelte:head>

<div class="civ-page-wrapper">
	<Breadcrumb
		items={[
			{ label: 'Mes civilisations', href: '/my-civilizations' },
			{ label: data.civilization.name, href: `/my-civilizations/${data.civilization.id}` },
			{ label: 'Succès' }
		]}
	/>

	<div class="civ-card civ-animate-in">
		<div style="border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px; margin-bottom:24px;">
			<div style="font-family:'Marcellus',serif; font-size:13px; letter-spacing:.4em; text-transform:uppercase; color:oklch(0.5 0.09 40); margin-bottom:6px;">Hauts faits</div>
			<h1 style="font-family:'Tangerine',cursive; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">Les succès de {data.civilization.name}</h1>
		</div>

		<!-- Score -->
		<div class="civ-inner-card" style="margin-bottom:24px;">
			<div style="display:flex; align-items:baseline; gap:16px; flex-wrap:wrap;">
				<span style="font-family:'Marcellus',serif; font-size:34px; color:oklch(0.4 0.1 34);">{data.score} points</span>
				<span style="font-size:16px; color:oklch(0.5 0.03 50);">{unlockedCount} / {ACHIEVEMENTS.length} succès débloqués · score maximal {ACHIEVEMENTS_MAX_SCORE}</span>
				<a href="/leaderboard" style="margin-left:auto; font-size:15px; color:oklch(0.45 0.1 145); text-decoration:none;">Voir le classement →</a>
			</div>
			<div style="margin-top:12px; height:10px; border-radius:999px; background:oklch(0.9 0.02 76); overflow:hidden;">
				<div style="height:100%; width:{progress}%; border-radius:999px; background:linear-gradient(90deg, oklch(0.55 0.14 38), oklch(0.5 0.13 34));"></div>
			</div>
		</div>

		<!-- Catalogue -->
		<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px;">
			{#each ACHIEVEMENTS as achievement (achievement.id)}
				{@const unlocked = unlockedById.get(achievement.id)}
				<div
					style="padding:14px 16px; border:1px solid {unlocked ? 'oklch(0.72 0.08 145)' : 'oklch(0.86 0.03 72)'}; border-radius:5px; background:{unlocked ? 'oklch(0.97 0.02 145 / 0.5)' : 'oklch(0.985 0.008 84)'}; display:flex; flex-direction:column; gap:6px; {unlocked ? '' : 'opacity:.62; filter:grayscale(.5);'}"
				>
					<div style="display:flex; align-items:center; gap:10px;">
						<span style="font-size:26px;">{achievement.emblem}</span>
						<span style="font-family:'Marcellus',serif; font-size:17px; color:oklch(0.32 0.04 40); flex:1;">{achievement.name}</span>
						<span style="font-family:'Marcellus',serif; font-size:15px; color:oklch(0.42 0.1 34); white-space:nowrap;">{achievement.points} pts</span>
					</div>
					<div style="font-size:14px; color:oklch(0.45 0.03 50); line-height:1.45;">{achievement.description}</div>
					{#if unlocked}
						<div style="font-size:13px; color:oklch(0.45 0.1 145);">
							✓ Débloqué{formatDate(unlocked.unlockedAt) ? ` le ${formatDate(unlocked.unlockedAt)}` : ''}
						</div>
					{:else}
						<div style="font-size:13px; color:oklch(0.55 0.03 50);">Encore à accomplir…</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
