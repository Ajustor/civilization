<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, Cuboid, FlameKindling } from 'lucide-svelte'

	import type { BuildingType, OccupationTypes, PeopleType } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion'
	import { OCCUPATIONS, resourceNames } from '$lib/translations'
	import PeopleTable from './datatables/people-table.svelte'
	import PeopleTree from './datatables/PeopleTree.svelte'
	import { callGetPeople, callGetPeopleStream } from '../../../services/sveltekit-api/people'
	import { onMount } from 'svelte'

	export let data: PageData

	let pageIndex = 0
	let pageSize = 10

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}

	const stringToColour = function (str: string) {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash)
		}
		let colour = '#'
		for (let i = 0; i < 3; i++) {
			const value = (hash >> (i * 8)) & 0xff
			colour += ('00' + value.toString(16)).substr(-2)
		}
		return colour
	}

	let people: PeopleType[] = []

	const retrievePeople = async (newPageIndex: number, newPageSize: number) => {
		const oldPeople = await data.lazy.people
		pageIndex = newPageIndex
		pageSize = newPageSize
		data.lazy.people = new Promise(async (resolve) => {
			try {
				const { people } = await callGetPeople(data.civilization.id, pageIndex, pageSize)
				resolve(people)
			} catch (error) {
				console.error(error)
				resolve(oldPeople)
			}
		})
	}
</script>

{#snippet citizensView()}
	{#await data.lazy.people}
		<div
			class="skeleton w-100 flex h-40 items-center justify-center rounded-md border border-slate-100 bg-slate-200"
		></div>
	{:then people}
		<!-- getPeopleFromCivilization() was fulfilled -->
		<PeopleTable
			{people}
			totalPeople={data.civilization.citizensCount ?? 0}
			updateData={retrievePeople}
			{pageIndex}
			{pageSize}
		/>
	{/await}
{/snippet}

{#snippet buildingsView(buildings: BuildingType[])}
	<BuildingsTable {buildings} />
{/snippet}

<Button variant="ghost" href="/my-civilizations"><ArrowLeft />Retour</Button>

<div class="flex w-full flex-col gap-5">
	<h1 class="text-3xl">Détail de la civilisation {data.civilization.name}</h1>
	<span
		>Votre civilisation vit depuis {~~(data.civilization.livedMonths / 12)} années et {~~(
			data.civilization.livedMonths % 12
		)} mois</span
	>
	<span>
		Ressources:
		<ul class="list-inside list-disc">
			{#each data.civilization.resources as resource}
				<IconText
					iconComponent={resourceIcons[resource.type]}
					text="{resourceNames[resource.type]}: {resource.quantity}"
				/>
			{/each}
		</ul>
	</span>

	<!-- promise was fulfilled -->
	<div class="grid grid-cols-1 gap-4 pl-0 md:grid-cols-3 lg:grid-cols-4">
		{#await data.lazy.stats.peopleRatio}
			<div
				class="skeleton card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2"
			></div>
		{:then peopleRatio}
			<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
				<div class="card-body">
					<h2 class="card-title">Rapport homme/femme dans la civilisation</h2>
					{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
						<Doughnut
							data={{
								labels: ['Hommes', 'Femmes', 'Femmes enceintes'],
								datasets: [
									{
										data: [
											peopleRatio.menAndWomen.men,
											peopleRatio.menAndWomen.women - peopleRatio.pregnantWomen,
											peopleRatio.pregnantWomen
										]
									}
								]
							}}
						/>
					{/await}
				</div>
			</div>
		{/await}

		{#await data.lazy.stats.jobs}
			<div
				class="skeleton card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2"
			></div>
		{:then jobs}
			<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
				<div class="card-body">
					<h2 class="card-title">Répartition des métiers dans la civilisation</h2>
					{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
						<Doughnut
							data={{
								labels: Object.keys(jobs).map((key: string) => OCCUPATIONS[key as OccupationTypes]),
								datasets: [
									{
										data: Object.values(jobs),
										backgroundColor: Object.keys(jobs).map((key) => stringToColour(key))
									}
								]
							}}
						/>
					{/await}
				</div>
			</div>
		{/await}
	</div>

	<Accordion class="w-full">
		<AccordionItem value="people-table">
			<AccordionTrigger>Citoyens: ({data.civilization.citizensCount} au total)</AccordionTrigger>
			<AccordionContent>
				{@render citizensView()}
			</AccordionContent>
		</AccordionItem>
		<AccordionItem value="buildings-table">
			<AccordionTrigger
				>Bâtiments: ({data.civilization.buildings.reduce((acc, { count }) => acc + count, 0)} au total)</AccordionTrigger
			>
			<AccordionContent>
				{@render buildingsView(data.civilization.buildings)}
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
