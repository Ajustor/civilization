<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'

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

<section>
	<Root
		opts={{
			align: 'start'
		}}
		class="w-full max-w-sm"
	>
		<Content>
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
									{#if civilization.citizens.length}
										<li>{civilization.name}</li>
									{/if}
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
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
