<script lang="ts">
	import { type BuildingType, BuildingTypes } from '@ajustor/simulation'

	let { buildings }: { buildings: BuildingType[] } = $props()

	const buildingLabels: Record<string, string> = {
		[BuildingTypes.CACHE]: 'Cache',
		[BuildingTypes.HOUSE]: 'Maison',
		[BuildingTypes.FARM]: 'Ferme',
		[BuildingTypes.KILN]: 'Charbonnière',
		[BuildingTypes.MINE]: 'Mine',
		[BuildingTypes.SAWMILL]: 'Scierie',
		[BuildingTypes.CAMPFIRE]: 'Feu de camp'
	}
</script>

<table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.3 0.04 40);">
	<thead>
		<tr style="border-bottom:2px solid oklch(0.78 0.045 70);">
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">Type de bâtiment</th>
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">Capacité / Unité restante</th>
			<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">Nombre</th>
		</tr>
	</thead>
	<tbody>
		{#each buildings as building (building.type)}
			<tr style="border-bottom:1px solid oklch(0.88 0.03 70);">
				<td style="padding:8px 12px;">{building.type ? (buildingLabels[building.type] ?? '') : ''}</td>
				<td style="padding:8px 12px;">{building.capacity ?? ''}</td>
				<td style="padding:8px 12px;">{building.count}</td>
			</tr>
		{/each}
	</tbody>
</table>
