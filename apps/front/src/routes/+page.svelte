<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { Block, Page } from 'konsta/svelte'

	export let data: PageData

	const translatedResourceName = {
		food: 'Nourriture',
		wood: 'Bois'
	}
</script>

<svelte:head>
	<title>Les mondes</title>
	<meta
		name="description"
		content="Une simulation d'un monde avec des civilisations qui vivent seule"
	/>
</svelte:head>

<Block class="m-auto flex w-3/4 flex-col items-center justify-center">
	<Root
		opts={{
			align: 'end',
			slidesToScroll: 'auto'
		}}
		class="w-full"
	>
		<Content class="w-full md:w-1/2 lg:w-1/3">
			{#each data.worlds as world}
				<!-- content here -->
				<Item>
					<Card>
						<CardHeader>
							<CardTitle>
								{world.name}
							</CardTitle>
						</CardHeader>
						<CardContent>
							Année: {world.year}, mois : {world.month}<br />
							Civilisations:
							<ul>
								{#each world.civilizations as civilization}
									<li>
										{civilization.name} ({civilization.citizens.length ? 'vivante' : 'morte'})
									</li>
								{/each}
							</ul>
							Resources:
							<ul>
								{#each world.resources as resource}
									<li>{translatedResourceName[resource.type]}: {resource.quantity} restante</li>
								{/each}
							</ul>
						</CardContent>
					</Card>
				</Item>
			{/each}
		</Content>
		<Previous variant="ghost" />
		<Next variant="ghost" />
	</Root>
</Block>

<style>
</style>
