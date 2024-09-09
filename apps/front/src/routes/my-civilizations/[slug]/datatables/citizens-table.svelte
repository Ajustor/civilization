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
	import { type CitizenType, ProfessionType } from '@ajustor/simulation'

	export let citizens: CitizenType[]

	const table = createTable(readable(citizens))

	const columns = table.createColumns([
		table.column({
			accessor: 'name',
			header: 'Nom'
		}),
		table.column({
			accessor: 'years',
			header: 'Age'
		}),
		table.column({
			accessor: 'lifeCounter',
			header: 'Points de vie'
		}),
		table.column({
			accessor: 'profession',
			header: 'Profession',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return {
					[ProfessionType.FARMER]: 'Fermier',
					[ProfessionType.CARPENTER]: 'Charpentier'
				}[value]
			}
		})
	])

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns)
</script>

<div class="rounded-md border border-slate-100 bg-slate-200">
	<Table>
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
