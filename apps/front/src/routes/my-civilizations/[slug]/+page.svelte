<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, Cuboid, FlameKindling } from 'lucide-svelte'
	import CitizensTable from './datatables/citizens-table.svelte'
	import type { BuildingType, CitizenType } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion'
	import { resourceNames } from '$lib/translations'

	export let data: PageData

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}
</script>

{#snippet citizensView(citizens: CitizenType[])}
	<CitizensTable {citizens} />
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
		<AccordionItem value="citizens-table">
			<AccordionTrigger>Citoyens: ({data.civilization.citizens.length} au total)</AccordionTrigger>
			<AccordionContent>
				{@render citizensView(data.civilization.citizens)}
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
</div>
