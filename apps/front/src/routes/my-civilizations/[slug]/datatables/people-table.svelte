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
	import { type PeopleType, Gender } from '@ajustor/simulation'
	import Icon from '@iconify/svelte'
	import { addPagination, addSortBy } from 'svelte-headless-table/plugins'
	import { OCCUPATIONS } from '$lib/translations'
	import ChildDetails from './childDetails.svelte'
	import PeopleTableActions from './people-table-actions.svelte'
	import { Button } from '$lib/components/ui/button'
	import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-svelte'

	export let people: PeopleType[]

	const table = createTable(readable(people), {
		sort: addSortBy(),
		page: addPagination()
	})

	const GenderIcons = {
		[Gender.FEMALE]: 'noto:female-sign',
		[Gender.MALE]: 'noto:male-sign',
		[Gender.UNKNOWN]: 'Inconnu'
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
				return createRender(Icon, { icon: GenderIcons[value] })
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
			header: 'Enfant à naître',
			cell: ({ value }) => {
				if (!value) {
					return ''
				}
				return createRender(ChildDetails, {
					gender: value.gender,
					name: value.name,
					occupation: value.occupation
				})
			}
		})
		// table.column({
		// 	accessor: ({ id }) => id,
		// 	header: 'Action sur le citoyen',
		// 	cell: ({ value }) => {
		// 		return createRender(PeopleTableActions, { id: value, people })
		// 	},
		// 	plugins: {
		// 		sort: {
		// 			disable: true
		// 		}
		// 	}
		// })
	])

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns)
	const { hasNextPage, hasPreviousPage, pageCount, pageIndex } = pluginStates.page
</script>

<div class="rounded-md border border-slate-100 bg-slate-200">
	<Table class="bg-neutral text-neutral-content">
		<TableHeader {...$tableAttrs}>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<TableRow>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
								<TableHead {...attrs}>
									{#if props.sort.disabled}
										<Render of={cell.render()} />
									{:else}
										<Button variant="ghost" on:click={props.sort.toggle}>
											<Render of={cell.render()} />
											{#if props.sort.order === 'asc'}
												<ArrowUp class="ml-2 h-4 w-4" />
											{:else if props.sort.order === 'desc'}
												<ArrowDown class="ml-2 h-4 w-4" />
											{:else}
												<ArrowUpDown class="ml-2 h-4 w-4" />
											{/if}
										</Button>
									{/if}
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
	<div class="flex items-center justify-center space-x-4 py-4">
		<Button
			variant="outline"
			size="sm"
			on:click={() => ($pageIndex = $pageIndex - 1)}
			disabled={!$hasPreviousPage}
		>
			Précédent
		</Button>
		<Button
			variant="outline"
			size="sm"
			disabled={!$hasNextPage}
			on:click={() => ($pageIndex = $pageIndex + 1)}
		>
			Suivant
		</Button>
		<!-- <select bind:value={$pageSize} class="select w-full max-w-xs">
			<option disabled>Nombre d'éléments par page</option>
			<option value={10}>10</option>
			<option value={25}>25</option>
			<option value={50}>50</option>
			<option value={100}>100</option>
		</select> -->
	</div>
</div>
