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
	<h1 class="text-2xl">Les règles de la simulation</h1>
	<ul>
		<li>Toutes les heures un mois passe</li>
		<li>
			Tous les mois les citoyens doivent manger et avoir un toit sur leur tête afin de gagner de la
			vie
		</li>
		<li>
			Les citoyens peuvent se reproduire tous les mois si leur santé est au moins de 8 et qu'ils ont
			entre 16 et 60 ans
		</li>
		<li>
			Chaque citoyen a un métier dans la liste suivante
			<ol>
				<li>Fermier (travaille de 4 a 70 ans et consome 1 de nourriture)</li>
				<li>Charpentier (travaille de 12 a 60 ans et consome 2 de nourriture)</li>
			</ol>
		</li>
		<li>
			Il existe des bâtiments qui peuvent être construits et apportent des améliorations aux métiers
			<ol>
				<li>Maison (aide les citoyens a rester en vie)</li>
			</ol>
		</li>
	</ul>
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
								{#each world.civilizations as civilisation}
									<li>{civilisation.name}</li>
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
