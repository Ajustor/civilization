<script lang="ts">
	import type { RecapData } from '@ajustor/civ-api'
	import { resourceNames, buildingNames, eventsName } from '$lib/translations'
	import type { ResourceTypes, BuildingTypes, Events } from '@ajustor/simulation'

	let { recap, onClose }: { recap: RecapData; onClose: () => void } = $props()

	const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')
	const signed = (n: number) => (n > 0 ? '+' : '') + fmt(n)
	const trendColor = (n: number) =>
		n > 0 ? 'oklch(0.42 0.12 140)' : n < 0 ? 'oklch(0.5 0.18 30)' : 'oklch(0.5 0.03 50)'

	const years = $derived(Math.floor(recap.monthsPassed / 12))
	const months = $derived(recap.monthsPassed % 12)
	const elapsed = $derived(
		[years > 0 ? `${years} an${years > 1 ? 's' : ''}` : '', months > 0 ? `${months} mois` : '']
			.filter(Boolean)
			.join(' et ') || 'moins d’un mois'
	)
	const movedResources = $derived(recap.resources.filter((r) => r.delta !== 0))
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	role="presentation"
	style="position:fixed; inset:0; z-index:70; background:rgba(24,14,4,.65); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px;"
	onclick={onClose}
>
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		style="background:radial-gradient(circle at 20% 10%, rgba(150,110,60,.08), transparent 50%), oklch(0.95 0.022 84); border:1px solid oklch(0.74 0.05 60); box-shadow:inset 0 0 0 5px oklch(0.93 0.03 84), inset 0 0 0 6px oklch(0.72 0.05 60), 0 24px 64px rgba(40,20,4,.5); border-radius:5px; width:min(96vw, 640px); max-height:88vh; overflow-y:auto;"
	>
		<div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; border-bottom:2px solid oklch(0.76 0.05 60);">
			<div>
				<div style="font-size:11px; letter-spacing:.12em; color:oklch(0.55 0.05 50); text-transform:uppercase; margin-bottom:4px;">Pendant ton absence</div>
				<h2 style="font-family:'Tangerine',cursive; font-size:34px; margin:0; color:oklch(0.3 0.04 40);">{elapsed} se sont écoulés</h2>
			</div>
			<button onclick={onClose} style="background:none; border:1px solid oklch(0.74 0.05 60); border-radius:4px; padding:8px 14px; cursor:pointer; font-size:18px; color:oklch(0.5 0.04 50); line-height:1;">✕</button>
		</div>

		<div style="padding:20px 24px; display:flex; flex-direction:column; gap:18px; font-family:'EB Garamond',serif; color:oklch(0.4 0.03 50);">
			<!-- Population -->
			<section>
				<h3 style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.4 0.04 50); margin:0 0 6px;">Population</h3>
				<div style="font-size:16px;">
					{fmt(recap.population.before)} → <strong style="color:oklch(0.3 0.04 40);">{fmt(recap.population.after)}</strong>
					<span style="color:{trendColor(recap.population.net)}; margin-left:8px;">{signed(recap.population.net)}</span>
					<span style="color:oklch(0.55 0.03 50); margin-left:8px; font-size:14px;">(pic : {fmt(recap.population.peak)})</span>
				</div>
			</section>

			<!-- Ressources -->
			{#if movedResources.length}
				<section>
					<h3 style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.4 0.04 50); margin:0 0 6px;">Ressources</h3>
					<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:6px 16px;">
						{#each movedResources as r}
							<div style="display:flex; justify-content:space-between; font-size:15px;">
								<span>{resourceNames[r.resourceType as ResourceTypes] ?? r.resourceType}</span>
								<span style="color:{trendColor(r.delta)};">{signed(r.delta)}</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Bâtiments -->
			{#if recap.buildings.length}
				<section>
					<h3 style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.4 0.04 50); margin:0 0 6px;">Nouveaux bâtiments</h3>
					<div style="display:flex; flex-wrap:wrap; gap:6px;">
						{#each recap.buildings as b}
							<span style="font-size:15px; padding:3px 10px; border-radius:3px; background:oklch(0.92 0.03 78); color:oklch(0.35 0.04 42);">
								+{b.count} {buildingNames[b.buildingType as BuildingTypes] ?? b.buildingType}
							</span>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Combats -->
			{#if recap.combats.total > 0}
				<section>
					<h3 style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.4 0.04 50); margin:0 0 6px;">Conflits</h3>
					<div style="font-size:15px;">
						{recap.combats.total} combat{recap.combats.total > 1 ? 's' : ''} ·
						<span style="color:oklch(0.42 0.12 140);">{recap.combats.wins} victoire{recap.combats.wins > 1 ? 's' : ''}</span> ·
						<span style="color:oklch(0.5 0.18 30);">{recap.combats.losses} défaite{recap.combats.losses > 1 ? 's' : ''}</span>
						{#if recap.combats.plunder > 0}· butin +{fmt(recap.combats.plunder)}{/if}
						{#if recap.combats.captives > 0}· {fmt(recap.combats.captives)} captif{recap.combats.captives > 1 ? 's' : ''}{/if}
					</div>
				</section>
			{/if}

			<!-- Événements -->
			{#if recap.events.length}
				<section>
					<h3 style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.4 0.04 50); margin:0 0 6px;">Événements</h3>
					<div style="display:flex; flex-direction:column; gap:4px;">
						{#each recap.events as e}
							<div style="font-size:15px;"><span style="color:oklch(0.5 0.08 40);">M{e.month}</span> — {eventsName[e.event as Events]}</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>
