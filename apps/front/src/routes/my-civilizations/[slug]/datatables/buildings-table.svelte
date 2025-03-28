<script lang="ts">
	import { createTable, Render, Subscribe } from 'svelte-headless-table'
	import { readable } from 'svelte/store'
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table'
	import { type BuildingType, BuildingTypes } from '@ajustor/simulation'

	export let buildings: BuildingType[]

	const table = createTable(readable(buildings))

	const columns = table.createColumns([
		table.column({
			accessor: 'type',
			header: 'Type de bâtiment',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return {
					[BuildingTypes.CACHE]: 'Cache',
					[BuildingTypes.HOUSE]: 'Maison',
					[BuildingTypes.FARM]: 'Ferme',
					[BuildingTypes.KILN]: 'Charbonnière',
					[BuildingTypes.MINE]: 'Mine',
					[BuildingTypes.SAWMILL]: 'Scierie',
					[BuildingTypes.CAMPFIRE]: 'Feu de camp',
					[BuildingTypes.OUTDOOR_KITCHEN]: 'Cuisine extérieure'
				}[value]
			}
		}),
		table.column({
			accessor: (content) => content.capacity ?? '',
			header: 'Capacité / Unité restante'
		}),
		table.column({
			accessor: 'count',
			header: 'Nombre de bâtiment de ce type'
		})
	])

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns)
</script>

<div class="rounded-md border border-slate-100 bg-slate-200">
	<Table class="bg-neutral text-neutral-content">
		<TableHeader {...$tableAttrs}>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<TableRow>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
								<TableHead {...attrs}>
									<Render of={cell.render()} />
								</TableHead>
							</Subscribe>
						{/each}
					</TableRow>
				</Subscribe>
			{/each}
		</TableHeader>
		<TableBody {...$tableBodyAttrs}>
			{#each $pageRows as row (row.id)}
				<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
					<TableRow {...rowAttrs}>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<TableCell {...attrs}>
									<Render of={cell.render()} />
								</TableCell>
							</Subscribe>
						{/each}
					</TableRow>
				</Subscribe>
			{/each}
		</TableBody>
	</Table>
</div>
