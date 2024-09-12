<script lang="ts">
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table'
	import { readable } from 'svelte/store'
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table'
	import { type CitizenType, OccupationTypes, Gender } from '@ajustor/simulation'
	import Icon from '@iconify/svelte'

	export let citizens: CitizenType[]

	const table = createTable(readable(citizens))

	const GENRES = {
		[Gender.FEMALE]: 'noto:female-sign',
		[Gender.MALE]: 'noto:male-sign',
		[Gender.UNKNOWN]: 'Inconnu'
	}

	const OCCUPATIONS = {
		[OccupationTypes.FARMER]: 'Fermier',
		[OccupationTypes.CARPENTER]: 'Charpentier'
	}

	const columns = table.createColumns([
		table.column({
			accessor: 'name',
			header: 'Nom'
		}),
		table.column({
			accessor: 'gender',
			header: 'Genre',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return createRender(Icon, { icon: GENRES[value] })
			}
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
			accessor: 'occupation',
			header: 'Occupation',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return OCCUPATIONS[value]
			}
		}),
		table.column({
			accessor: 'pregnancyMonthsLeft',
			header: 'Mois avant accouchement',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return value
			}
		}),
		table.column({
			accessor: 'child',
			header: 'Enfant a naitre',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return `nom: ${value.name}, occupation: ${OCCUPATIONS[value?.occupation ?? OccupationTypes.FARMER]}, genre: ${<Icon icon="GENRES[value.gender]"/>}`
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
