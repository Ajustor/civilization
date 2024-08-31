<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'

	export let data: PageData

	const translatedResourceName = {
		food: 'Nouriture',
		wood: 'bois'
	}
</script>

<svelte:head>
	<title>Mes civilisations</title>
	<meta name="description" content="La page pour gérer mes civilisations" />
</svelte:head>

<section>
	<Root
		opts={{
			align: 'start'
		}}
		class="w-full max-w-sm"
	>
		<Content>
			{#each data.myCivilizations as civilization}
				<!-- content here -->
				<Item>
					<Card>
						<CardHeader>
							<CardTitle>
								{civilization.name}
							</CardTitle>
						</CardHeader>
						<CardContent>
							Citoyens:
							<ul>
								{#each civilization.citizens as citizen}
									<li>
										{citizen.name} ({citizen.years} ans): {citizen.profession}
										Nombre de point de vie restant: {citizen.lifeCounter}
									</li>
								{/each}
							</ul>
							Bâtiments:
							<ul>
								{#each civilization.buildings as building}
									<li>
										{building.type}: avec une capacité de {building.capacity} citoyens
									</li>
								{/each}
							</ul>
							Resources:
							<ul>
								{#each civilization.resources as resource}
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
