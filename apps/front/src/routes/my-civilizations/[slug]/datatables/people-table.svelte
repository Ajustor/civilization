<script lang="ts">
	import { type PeopleType, Gender } from '@ajustor/simulation'
	import Icon from '@iconify/svelte'
	import { OCCUPATIONS } from '$lib/translations'
	import ChildDetails from './childDetails.svelte'
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

<div>
	<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 0;">
		<div style="display:flex; align-items:center; gap:8px;">
			<button
				onclick={() => updateData(pageIndex - 1, pageSize)}
				disabled={!hasPreviousPage}
				style="padding:6px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer; opacity:{!hasPreviousPage ? 0.4 : 1};"
			>Précédent</button>
			<span style="font-size:15px; color:oklch(0.5 0.03 50);">{pageIndex + 1} / {pageCount}</span>
			<button
				onclick={() => updateData(pageIndex + 1, pageSize)}
				disabled={!hasNextPage}
				style="padding:6px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; cursor:pointer; opacity:{!hasNextPage ? 0.4 : 1};"
			>Suivant</button>
		</div>
		<select
			value={pageSize}
			style="padding:6px 12px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:oklch(0.97 0.015 84); color:oklch(0.35 0.04 40); font-family:'EB Garamond',serif; font-size:15px;"
			onchange={(e) => updateData(0, Number(e.currentTarget.value))}
		>
			<option disabled>Éléments par page</option>
			<option value={10}>10</option>
			<option value={25}>25</option>
			<option value={50}>50</option>
			<option value={100}>100</option>
			<option value={1000}>1000</option>
		</select>
	</div>
	<table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.3 0.04 40);">
		<thead>
			<tr style="border-bottom:2px solid oklch(0.78 0.045 70);">
				{#each sortableColumns as col (col.key)}
					<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">
						<button onclick={() => toggleSort(col.key)} style="display:flex; align-items:center; gap:4px; background:none; border:none; cursor:pointer; font-family:inherit; font-size:inherit; color:inherit; padding:0;">
							{col.header}
							{#if sortKey === col.key && sortOrder === 'asc'}
								<ArrowUp size="14" />
							{:else if sortKey === col.key && sortOrder === 'desc'}
								<ArrowDown size="14" />
							{:else}
								<ArrowUpDown size="14" />
							{/if}
						</button>
					</th>
				{/each}
				<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">Mois avant accouchement</th>
				<th style="text-align:left; padding:8px 12px; font-weight:600; color:oklch(0.4 0.04 50);">Enfant à naître</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedPeople as person (person.id ?? Math.random())}
				<tr style="border-bottom:1px solid oklch(0.88 0.03 70);">
					<td style="padding:8px 12px;">
						{#if person.gender}
							<Icon icon={GenderIcons[person.gender]} />
						{/if}
					</td>
					<td style="padding:8px 12px;">{person.years}</td>
					<td style="padding:8px 12px;">{person.lifeCounter}</td>
					<td style="padding:8px 12px;">{person.occupation ? (OCCUPATIONS[person.occupation] ?? '') : ''}</td>
					<td style="padding:8px 12px;">{person.pregnancyMonthsLeft ?? ''}</td>
					<td style="padding:8px 12px;">
						{#if person.child}
							<ChildDetails gender={person.child.gender} occupation={person.child.occupation} />
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
