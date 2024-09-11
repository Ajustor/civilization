<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, FlameKindling } from 'lucide-svelte'
	import CitizensTable from './datatables/citizens-table.svelte'
	import { Block } from 'konsta/svelte'
	import type { BuildingType, CitizenType } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion'

	export let data: PageData

	const translatedResourceName = {
		food: 'Nouriture',
		wood: 'Bois'
	}
	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling
	}
</script>

{#snippet citizensView(citizens: CitizenType[])}
	<CitizensTable {citizens} />
{/snippet}

{#snippet buildingsView(buildings: BuildingType[])}
	<BuildingsTable {buildings} />
{/snippet}

<Button variant="ghost" href="/my-civilizations"><ArrowLeft />Retour</Button>

<Block class="flex w-full flex-col gap-5">
	<h1 class="text-3xl">Détail de la civilisation {data.civilization.name}</h1>
	<span
		>Votre civilisation vit depuis {~~(data.civilization.livedMonths / 12)} années et {~~(
			data.civilization.livedMonths % 12
		)} mois</span
	>
	<Accordion class="w-full">
		<AccordionItem value="citizens-table">
			<AccordionTrigger>Citoyens:</AccordionTrigger>
			<AccordionContent>
				{@render citizensView(data.civilization.citizens)}
			</AccordionContent>
		</AccordionItem>
		<AccordionItem value="buildings-table">
			<AccordionTrigger>Bâtiments:</AccordionTrigger>
			<AccordionContent>
				{@render buildingsView(data.civilization.buildings)}
			</AccordionContent>
		</AccordionItem>
	</Accordion>
	<!-- <span> </span>
	<span>
		Bâtiments:
		<ul class="list-inside list-disc">
			{#each data.civilization.buildings as building}
				<li>
					{building.type}: avec une capacité de {building.capacity} citoyens
				</li>
			{/each}
		</ul>
	</span> -->
	<span>
		Ressources:
		<ul class="list-inside list-disc">
			{#each data.civilization.resources as resource}
				<IconText
					iconComponent={resourceIcons[resource.type]}
					text="{translatedResourceName[resource.type]}: {resource.quantity}"
				/>
			{/each}
		</ul>
	</span>
</Block>
