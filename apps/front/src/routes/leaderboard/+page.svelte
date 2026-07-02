<script lang="ts">
	import type { PageData } from './$types'
	import { ACHIEVEMENTS, ACHIEVEMENTS_MAX_SCORE, getAchievement } from '@ajustor/simulation'

	let { data }: { data: PageData } = $props()

	const medals = ['🥇', '🥈', '🥉']

	const achievementTitles = (ids: string[]) =>
		ids
			.map((id) => {
				const achievement = getAchievement(id)
				return achievement ? `${achievement.emblem} ${achievement.name}` : null
			})
			.filter(Boolean)
			.join('\n')
</script>

<svelte:head>
	<title>Classement — Civilizations</title>
	<meta name="description" content="Le tableau des scores des civilisations, calculé sur leurs succès" />
</svelte:head>

<div class="civ-page-wrapper">
	<div class="civ-card civ-animate-in">
		<div style="border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px; margin-bottom:28px;">
			<div style="font-family:'Marcellus',serif; font-size:13px; letter-spacing:.4em; text-transform:uppercase; color:oklch(0.5 0.09 40); margin-bottom:6px;">Hall des légendes</div>
			<h1 style="font-family:'Tangerine',cursive; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">Le classement des civilisations</h1>
			<p style="font-size:16px; color:oklch(0.46 0.03 50); margin:8px 0 0;">
				Chaque civilisation gagne des points en débloquant des <strong>succès</strong> : jalons de population,
				longévité, découvertes, prospérité ou faits d'armes. Un succès débloqué reste acquis pour toujours —
				même pour les civilisations éteintes. Score maximal : <strong>{ACHIEVEMENTS_MAX_SCORE} points</strong>
				({ACHIEVEMENTS.length} succès).
			</p>
		</div>

		{#if data.leaderboard.length === 0}
			<p style="color:oklch(0.5 0.03 50); font-size:17px;">Aucune civilisation n'a encore débloqué de succès. L'histoire reste à écrire…</p>
		{:else}
			<div style="overflow-x:auto;">
				<table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.4 0.03 50);">
					<thead>
						<tr style="border-bottom:2px solid oklch(0.78 0.04 70);">
							<th style="text-align:center; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Rang</th>
							<th style="text-align:left; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Civilisation</th>
							<th style="text-align:left; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Monde</th>
							<th style="text-align:center; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Succès</th>
							<th style="text-align:right; padding:8px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Score</th>
						</tr>
					</thead>
					<tbody>
						{#each data.leaderboard as row, index (row.civilizationId)}
							<tr style="border-bottom:1px solid oklch(0.88 0.03 70); {index < 3 ? 'background:oklch(0.97 0.02 84);' : ''}">
								<td style="padding:10px 12px; text-align:center; font-size:18px;">
									{medals[index] ?? index + 1}
								</td>
								<td style="padding:10px 12px; font-family:'Marcellus',serif; color:oklch(0.32 0.04 40);">
									{row.name}
									{#if !row.isAlive}
										<span title="Civilisation éteinte" style="margin-left:6px;">🪦</span>
									{/if}
								</td>
								<td style="padding:10px 12px;">{row.worldName ?? '—'}</td>
								<td style="padding:10px 12px; text-align:center;" title={achievementTitles(row.achievements)}>
									{row.achievements.length} / {ACHIEVEMENTS.length}
								</td>
								<td style="padding:10px 12px; text-align:right; font-family:'Marcellus',serif; font-size:18px; color:oklch(0.4 0.1 34);">
									{row.score}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
