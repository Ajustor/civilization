<script lang="ts">
	import { type BuildingType, BuildingTypes, type ResourceTypes, type OccupationTypes } from '@ajustor/simulation'
	import { buildingNames, resourceNames, OCCUPATIONS } from '$lib/translations'
	import { getBuildingMeta } from '$lib/gameData'
	import { ChevronRight, ChevronDown } from '@lucide/svelte'

	let { buildings }: { buildings: BuildingType[] } = $props()

	// Lignes dépliées, repérées par le type de bâtiment.
	let expanded = $state<Set<string>>(new Set())

	const toggle = (type: string) => {
		const next = new Set(expanded)
		if (next.has(type)) {
			next.delete(type)
		} else {
			next.add(type)
		}
		expanded = next
	}
</script>

<div style="overflow-x:auto;">
<table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.3 0.04 40);">
	<thead>
		<tr style="border-bottom:2px solid oklch(0.78 0.045 70);">
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50); white-space:nowrap;">Type de bâtiment</th>
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50); white-space:nowrap;">Capacité / Unité restante</th>
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50); white-space:nowrap;">Nombre</th>
		</tr>
	</thead>
	<tbody>
		{#each buildings as building (building.type)}
			{@const type = building.type as BuildingTypes}
			{@const meta = building.type ? getBuildingMeta(type) : null}
			{@const isOpen = building.type ? expanded.has(building.type) : false}
			<tr
				style="border-bottom:1px solid oklch(0.88 0.03 70); cursor:{meta ? 'pointer' : 'default'};"
				onclick={() => building.type && meta && toggle(building.type)}
			>
				<td style="padding:8px 12px;">
					<span style="display:inline-flex; align-items:center; gap:6px;">
						{#if meta}
							{#if isOpen}
								<ChevronDown size="16" style="color:oklch(0.55 0.05 50);" />
							{:else}
								<ChevronRight size="16" style="color:oklch(0.55 0.05 50);" />
							{/if}
						{/if}
						{building.type ? (buildingNames[type] ?? '') : ''}
					</span>
				</td>
				<td style="padding:8px 12px;">{building.capacity ?? ''}</td>
				<td style="padding:8px 12px;">{building.count}</td>
			</tr>
			{#if isOpen && meta}
				<tr style="border-bottom:1px solid oklch(0.88 0.03 70); background:oklch(0.97 0.012 84);">
					<td colspan="3" style="padding:14px 16px 16px 34px;">
						<div style="display:grid; grid-template-columns:auto 1fr; gap:6px 14px; font-size:15px; color:oklch(0.4 0.04 48); max-width:640px;">
							<!-- Production -->
							<span style="color:oklch(0.55 0.04 55);">Production / mois</span>
							<span>
								{#if meta.isExtraction}
									{#if building.outputResources?.length}
										{#each building.outputResources as out, i}{i > 0 ? ', ' : ''}{resourceNames[out.resource as ResourceTypes] ?? out.resource}{out.probability != null ? ` (${out.probability}%)` : ''}{/each}
									{:else}
										Pierre (déterminée à la construction)
									{/if}
								{:else if meta.inputResources.length && meta.outputResources.length}
									{#each meta.inputResources as inp, i}{i > 0 ? ' + ' : ''}{inp.amount} {resourceNames[inp.resource] ?? inp.resource}{/each}
									→
									{#each meta.outputResources as out, i}{i > 0 ? ' + ' : ''}{out.amount} {resourceNames[out.resource] ?? out.resource}{/each}
								{:else if meta.outputResources.length}
									{#each meta.outputResources as out, i}{i > 0 ? ', ' : ''}+{out.amount} {resourceNames[out.resource] ?? out.resource}{/each}
								{:else if meta.researchOutput}
									+{meta.researchOutput} points de recherche
								{:else}
									—
								{/if}
							</span>

							<!-- Main-d'œuvre d'exploitation -->
							{#if meta.operatingWorkers.length}
								<span style="color:oklch(0.55 0.04 55);">Exploité par</span>
								<span>
									{#each meta.operatingWorkers as w, i}{i > 0 ? ', ' : ''}{w.count} {OCCUPATIONS[w.occupation as OccupationTypes] ?? w.occupation}{/each}
								</span>
							{/if}

							<!-- Coût de construction -->
							<span style="color:oklch(0.55 0.04 55);">Coût</span>
							<span>
								{#if meta.constructionCosts.length}
									{#each meta.constructionCosts as c, i}{i > 0 ? ' + ' : ''}{c.amount} {resourceNames[c.resource] ?? c.resource}{/each}
								{:else}
									Aucune ressource requise
								{/if}
							</span>

							<!-- Ouvriers pour construire -->
							{#if meta.buildWorkers.length}
								<span style="color:oklch(0.55 0.04 55);">Construit par</span>
								<span>
									{#each meta.buildWorkers as w, i}{i > 0 ? ', ' : ''}{w.amount} {OCCUPATIONS[w.occupation as OccupationTypes] ?? w.occupation}{/each}
								</span>
							{/if}

							<!-- Temps -->
							<span style="color:oklch(0.55 0.04 55);">Temps de construction</span>
							<span>{meta.timeToBuild} mois</span>

							<!-- Effet éditorial -->
							{#if meta.effect}
								<span style="color:oklch(0.55 0.04 55);">Effet</span>
								<span>{meta.effect}</span>
							{/if}
						</div>
					</td>
				</tr>
			{/if}
		{/each}
	</tbody>
</table>
</div>
