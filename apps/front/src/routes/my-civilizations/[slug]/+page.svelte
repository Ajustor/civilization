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

	async function fetchPeoples() {
		const reader = await callGetPeopleStream(data.civilization.id)
		const decoder = new TextDecoder()

		let chunkData: string = ''

		if (reader) {
			while (true) {
				const { done, value } = await reader.read()
				if (done) {
					break
				}

				// Décoder et analyser chaque morceau reçu comme un objet JSON
				const chunkText = decoder.decode(value)
				const lines = chunkText.split('\n\n\n')
				const jsonData = lines.reduce<PeopleType[]>((jsonData, line) => {
					if (!line) {
						return jsonData
					}

					chunkData += line

					try {
						const parsedData = JSON.parse(chunkData)
						chunkData = ''
						return [...jsonData, ...parsedData]
					} catch (error) {
						return jsonData
					}
				}, [])
				people = [...people, ...jsonData]
			}
		}
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

	onMount(async () => {
		await fetchPeoples()
	})
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

	{#await data.lazy.stats}
		<div
			class="skeleton w-100 md:w-50 flex h-40 items-center justify-center rounded-md border border-slate-100 bg-slate-200"
		></div>
		<div
			class="skeleton w-100 md:w-50 flex h-40 items-center justify-center rounded-md border border-slate-100 bg-slate-200"
		></div>
	{:then stats}
		<!-- promise was fulfilled -->
		<div class="grid grid-cols-1 gap-4 pl-0 md:grid-cols-3 lg:grid-cols-4">
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
											stats.menAndWomen.men,
											stats.menAndWomen.women - stats.pregnantWomen,
											stats.pregnantWomen
										]
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
