<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { Citizen } from '../../../types/citizen'
	import type { PageData } from './$types'
	import { ArrowLeft, Carrot, FlameKindling } from 'lucide-svelte'
	import CitizensTable from './datatables/citizens-table.svelte'
	import { Block } from 'konsta/svelte'
	import IconText from '$lib/components/IconText/icon-text.svelte'

	export let data: PageData

	const translatedResourceName = {
		food: 'Nourriture',
		wood: 'Bois'
	}

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling
	}
</script>

{#snippet citizensView(citizens: Citizen[])}
	<CitizensTable {citizens} />
{/snippet}

<Button variant="ghost" href="/my-civilizations"><ArrowLeft />Retour</Button>

<Block class="flex w-full flex-col gap-5">
	<h1 class="text-3xl">Détail de la civilisation {data.civilization.name}</h1>
	<span>
		Citoyens:
		{@render citizensView(data.civilization.citizens)}
	</span>
	<span>
		Bâtiments:
		<ul class="list-inside list-disc">
			{#each data.civilization.buildings as building}
				<li>
					{building.type}: avec une capacité de {building.capacity} citoyens
				</li>
			{/each}
		</ul>
	</span>
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
