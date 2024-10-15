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

	export let data: PageData

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
</script>

{#snippet citizensView()}
	{#await data.lazy.people}
		<span class="loading loading-infinity loading-lg"></span>
	{:then people}
		<!-- getPeopleFromCivilization() was fulfilled -->
		<PeopleTable {people} />
	{:catch error}
		{error}
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

	{#await data.lazy.stats then stats}
		<!-- promise was fulfilled -->
		<div class="grid grid-cols-1 gap-4 pl-0 md:grid-cols-3 lg:grid-cols-4">
			<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
				<div class="card-body">
					<h2 class="card-title">Rapport homme/femme dans la civilisation</h2>
					{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
						<Doughnut
							data={{
								labels: ['Hommes', 'Femmes'],
								datasets: [
									{
										data: [stats.menAndWomen.men, stats.menAndWomen.women]
									}
								]
							}}
						/>
					{/await}
				</div>
			</div>

			<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
				<div class="card-body">
					<h2 class="card-title">Répartition des métiers dans la civilisation</h2>
					{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
						<Doughnut
							data={{
								labels: Object.keys(stats.jobs).map(
									(key: string) => OCCUPATIONS[key as OccupationTypes]
								),
								datasets: [
									{
										data: Object.values(stats.jobs),
										backgroundColor: Object.keys(stats.jobs).map((key) => stringToColour(key))
									}
								]
							}}
						/>
					{/await}
				</div>
			</div>
		</div>
	{/await}
</div>
