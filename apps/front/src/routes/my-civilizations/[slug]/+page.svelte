<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, Cuboid, FlameKindling } from 'lucide-svelte'

	import type { BuildingType, PeopleType } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion'
	import { resourceNames } from '$lib/translations'
	import PeopleTable from './datatables/people-table.svelte'

	export let data: PageData

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}
</script>

{#snippet citizensView(people: PeopleType[])}
	<PeopleTable {people} />
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
			<AccordionTrigger>Citoyens: ({data.civilization.people.length} au total)</AccordionTrigger>
			<AccordionContent>
				{@render citizensView(data.civilization.people)}
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
