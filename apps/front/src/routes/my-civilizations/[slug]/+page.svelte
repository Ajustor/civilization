<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, Cuboid, FlameKindling } from 'lucide-svelte'

	import {
		ResourceTypes,
		type BuildingType,
		type OccupationTypes,
		type PeopleType
	} from '@ajustor/simulation'
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
	import { callGetPeople, callGetPeopleStream } from '../../../services/sveltekit-api/people'

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

	const RESOURCES_INDEXES = {
		[ResourceTypes.FOOD]: 0,
		[ResourceTypes.WOOD]: 1,
		[ResourceTypes.STONE]: 2
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

	<div class="grid grid-cols-1 gap-4 pl-0">
		{#await data.lazy.stats.civilization}
			<div
				class="skeleton card bg-neutral text-neutral-content h-16 w-1/2 rounded shadow-xl md:col-span-2"
			></div>
		{:then civilizationStats}
			{@const resources = civilizationStats.map(({ resources }) => resources)}
			{@const peoples = civilizationStats.map(({ people }) => people)}
			{@const labels = civilizationStats.map(({ month }) => `Mois: ${month}`)}
			{#if resources.length}
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Progression des ressources</h2>
						{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
							<Line
								data={{
									labels,
									datasets: resources.reduce<{ data: number[]; label: string; type: string }[]>(
										(datasets, civilizationResources) => {
											for (const resource of civilizationResources) {
												if (!resource?.resourceType) {
													continue
												}
												datasets[RESOURCES_INDEXES[resource.resourceType as ResourceTypes]] ??= {
													data: [],
													label: resourceNames[resource.resourceType as ResourceTypes],
													type: 'line'
												}
												datasets[
													RESOURCES_INDEXES[resource.resourceType as ResourceTypes]
												].data.push(resource.quantity ?? 0)
											}
											return datasets
										},
										[]
									)
								}}
							/>
						{/await}
					</div>
				</div>
			{/if}

			{#if peoples.length}
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Progression de la population</h2>
						{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
							Progression de la population
							<Line
								data={{
									labels,
									datasets: peoples.reduce<{ data: number[]; type: string; label: string }[]>(
										(datasets, data) => {
											datasets[0] ??= { data: [], type: 'line', label: 'Hommes' }
											datasets[1] ??= { data: [], type: 'line', label: 'Femmes' }
											datasets[2] ??= { data: [], type: 'line', label: 'Femmes enceintes' }

											datasets[0].data.push(data?.men ?? 0)
											datasets[1].data.push(data?.women ?? 0)
											datasets[2].data.push(data?.pregnantWomen ?? 0)
											return datasets
										},
										[]
									)
								}}
							/>
						{/await}
					</div>
				</div>
			{/if}
		{/await}
	</div>

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
