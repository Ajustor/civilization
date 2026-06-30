<script lang="ts">
	import { changelog, changeKindLabels, changeKindColors } from '$lib/changelog'
	import type { ChangeKind, ChangelogChange } from '$lib/changelog'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'

	// Ordre d'affichage des changements : nouveautés, puis améliorations, puis corrections.
	const KIND_ORDER: Record<ChangeKind, number> = { feature: 0, improvement: 1, fix: 2 }
	const sortByKind = (changes: ChangelogChange[]): ChangelogChange[] =>
		[...changes].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
</script>

<svelte:head>
	<title>Mises à jour — Civilizations</title>
	<meta
		name="description"
		content="Découvrez les dernières nouveautés et améliorations du jeu Civilizations."
	/>
</svelte:head>

<div class="civ-page-wrapper">
	<Breadcrumb items={[{ label: 'Mises à jour' }]} />

	<div
		class="civ-card"
		style="max-width:820px; margin:0 auto; display:flex; flex-direction:column; gap:8px;"
	>
		<h1
			style="font-family:'Tangerine',cursive; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);"
		>
			Journal des mises à jour
		</h1>
		<p style="font-size:17px; color:oklch(0.46 0.03 50); margin:0 0 8px;">
			Retrouvez ici les dernières nouveautés, améliorations et corrections apportées au jeu.
		</p>

		<div style="display:flex; flex-direction:column; gap:24px; margin-top:8px;">
			{#each changelog as entry (entry.date + entry.title)}
				<div class="civ-inner-card">
					<div
						style="display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:14px;"
					>
						<h2 class="civ-section-title" style="margin:0;">{entry.title}</h2>
						<span style="font-size:14px; color:oklch(0.5 0.04 50);">{formatDate(entry.date)}</span>
					</div>

					<div style="display:flex; flex-direction:column; gap:10px;">
						{#each sortByKind(entry.changes) as change}
							<div style="display:flex; align-items:flex-start; gap:10px;">
								<span
									style="flex-shrink:0; font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:600; color:oklch(0.97 0.02 84); background:{changeKindColors[
										change.kind
									]}; border-radius:999px; padding:3px 10px; min-width:96px; text-align:center;"
									>{changeKindLabels[change.kind]}</span
								>
								<span style="font-size:16px; color:oklch(0.36 0.04 42); line-height:1.45;"
									>{change.text}</span
								>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
