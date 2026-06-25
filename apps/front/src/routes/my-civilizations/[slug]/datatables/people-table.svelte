<script lang="ts">
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
	import { OCCUPATIONS } from '$lib/translations'
	import ChildDetails from './childDetails.svelte'
	import { Button } from '$lib/components/ui/button'
	import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/svelte'

	type SortKey = 'gender' | 'years' | 'lifeCounter' | 'occupation'
	type SortOrder = 'asc' | 'desc' | null

	type Props = {
		people: PeopleType[]
		totalPeople: number
		updateData: (pageIndex: number, pageSize: number) => void
		pageIndex: number
		pageSize: number
	}

	let { people, totalPeople, updateData, pageIndex, pageSize }: Props = $props()

	const GenderIcons: Record<string, string> = {
		[Gender.FEMALE]: 'noto:female-sign',
		[Gender.MALE]: 'noto:male-sign',
		[Gender.UNKNOWN]: 'Inconnu'
	}

	let sortKey = $state<SortKey | null>(null)
	let sortOrder = $state<SortOrder>(null)

	const pageCount = $derived(Math.ceil(totalPeople / pageSize))
	const hasPreviousPage = $derived(pageIndex > 0)
	const hasNextPage = $derived(pageIndex + 1 < pageCount)

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			if (sortOrder === 'asc') {
				sortOrder = 'desc'
			} else {
				sortKey = null
				sortOrder = null
			}
		} else {
			sortKey = key
			sortOrder = 'asc'
		}
	}

	const sortedPeople = $derived.by(() => {
		if (!sortKey || !sortOrder) return people
		const k = sortKey
		const o = sortOrder
		return [...people].sort((a, b) => {
			const av = a[k] as string | number | null | undefined
			const bv = b[k] as string | number | null | undefined
			if (av == null && bv == null) return 0
			if (av == null) return 1
			if (bv == null) return -1
			if (av < bv) return o === 'asc' ? -1 : 1
			if (av > bv) return o === 'asc' ? 1 : -1
			return 0
		})
	})

	const sortableColumns: { key: SortKey; header: string }[] = [
		{ key: 'gender', header: 'Genre' },
		{ key: 'years', header: 'Age' },
		{ key: 'lifeCounter', header: 'Points de vie' },
		{ key: 'occupation', header: 'Occupation' }
	]
</script>

<div class="rounded-md">
	<div class="flex items-center justify-between space-x-4 py-4">
		<div class="flex items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => updateData(pageIndex - 1, pageSize)}
				disabled={!hasPreviousPage}
			>
				Précédent
			</Button>
			<p>{pageIndex + 1}/{pageCount}</p>
			<Button
				variant="outline"
				size="sm"
				disabled={!hasNextPage}
				onclick={() => updateData(pageIndex + 1, pageSize)}
			>
				Suivant
			</Button>
		</div>
		<select
			value={pageSize}
			class="select select-bordered w-full max-w-xs"
			onchange={(e) => updateData(0, Number(e.currentTarget.value))}
		>
			<option disabled>Nombre d'éléments par page</option>
			<option value={10}>10</option>
			<option value={25}>25</option>
			<option value={50}>50</option>
			<option value={100}>100</option>
			<option value={1000}>1000</option>
		</select>
	</div>
	<Table class="bg-neutral text-neutral-content">
		<TableHeader>
			<TableRow>
				{#each sortableColumns as col (col.key)}
					<TableHead>
						<Button variant="ghost" onclick={() => toggleSort(col.key)}>
							{col.header}
							{#if sortKey === col.key && sortOrder === 'asc'}
								<ArrowUp class="ml-2 h-4 w-4" />
							{:else if sortKey === col.key && sortOrder === 'desc'}
								<ArrowDown class="ml-2 h-4 w-4" />
							{:else}
								<ArrowUpDown class="ml-2 h-4 w-4" />
							{/if}
						</Button>
					</TableHead>
				{/each}
				<TableHead>Mois avant accouchement</TableHead>
				<TableHead>Enfant à naître</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each sortedPeople as person (person.id ?? Math.random())}
				<TableRow>
					<TableCell>
						{#if person.gender}
							<Icon icon={GenderIcons[person.gender]} />
						{/if}
					</TableCell>
					<TableCell>{person.years}</TableCell>
					<TableCell>{person.lifeCounter}</TableCell>
					<TableCell>{person.occupation ? (OCCUPATIONS[person.occupation] ?? '') : ''}</TableCell>
					<TableCell>{person.pregnancyMonthsLeft ?? ''}</TableCell>
					<TableCell>
						{#if person.child}
							<ChildDetails gender={person.child.gender} occupation={person.child.occupation} />
						{/if}
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
