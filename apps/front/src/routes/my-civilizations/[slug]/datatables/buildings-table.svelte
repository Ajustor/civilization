<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table'
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

<div class="rounded-md border border-slate-100 bg-slate-200">
	<Table class="bg-neutral text-neutral-content">
		<TableHeader>
			<TableRow>
				<TableHead>Type de bâtiment</TableHead>
				<TableHead>Capacité / Unité restante</TableHead>
				<TableHead>Nombre de bâtiment de ce type</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each buildings as building (building.type)}
				<TableRow>
					<TableCell>{building.type ? (buildingLabels[building.type] ?? '') : ''}</TableCell>
					<TableCell>{building.capacity ?? ''}</TableCell>
					<TableCell>{building.count}</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
