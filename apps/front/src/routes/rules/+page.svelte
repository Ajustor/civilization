<script lang="ts">
	import { BASE_FOOD_GENERATION, BASE_WOOD_GENERATION } from '@ajustor/simulation/src/world'
	import { Block, List, ListItem } from 'konsta/svelte'
</script>

<svelte:head>
	<title>Les règles de la simulation</title>
	<meta
		name="description"
		content="Une simulation d'un monde avec des civilisations qui vivent seule"
	/>
</svelte:head>

<div class="m-auto flex flex-col items-center justify-center lg:w-3/4">
	<h1 class="text-2xl">Les règles de la simulation</h1>
	<List strong inset>
		<ListItem title="Les règles du monde">
			<ul slot="inner" class="list-disc">
				<li>Toutes les 15 minutes un mois passe</li>
				<li>
					Tous les mois les citoyens doivent manger et avoir un logement afin de gagner de la vie.
					De plus en automne et en hiver, les citoyens ont besoin de bois pour se réchauffer
				</li>
				<li>Un citoyen qui atteint l'age de 85 ans a 20% de chances de mourir chaque mois</li>
				<li>
					Les citoyens peuvent se reproduire tous les mois si leur santé est d'au moins de 8 et
					qu'ils ont entre 16 et 60 ans
				</li>
				<li>
					La population de chaque civilisation est limitée à 100 000 habitants. Hors retraités.
				</li>
				<li>
					Chaque citoyen a un métier dans la liste suivante :
					<ol class="list-inside list-decimal">
						<li>Fermier (travaille de 4 à 70 ans et consomme 1 de nourriture)</li>
						<li>Charpentier (travaille de 12 à 60 ans et consomme 2 de nourriture)</li>
					</ol>
				</li>
				<li>
					Il existe des bâtiments qui peuvent être construits et apportent des améliorations aux
					métiers
					<ol class="list-inside list-decimal">
						<li>Maison (aide les citoyens à rester en vie)</li>
					</ol>
				</li>
				<li>
					Le monde est sur un cycle de 12 mois, chaque groupes de 3 mois correspond a une saison
				</li>
				<ol class="list-inside list-disc">
					<li>0, 1, 2: printemps</li>
					<li>3, 4, 5: été</li>
					<li>6, 7, 8: automne</li>
					<li>9, 10, 11: hiver</li>
				</ol>
				<li>
					Le monde reconstitue ses réserves de ressources suivant ces règles
					<ol class="list-inside list-decimal">
						<li>
							au printemps<br />
							{BASE_FOOD_GENERATION} de nourriture, avec un facteur de 1.5
							{BASE_WOOD_GENERATION} de bois, avec un facteur de 1.1
						</li>
						<li>
							en été<br />
							{BASE_FOOD_GENERATION} de nourriture, avec un facteur de 1.75
							{BASE_WOOD_GENERATION} de bois, avec un facteur de 1.2
						</li>
						<li>
							en automne<br />
							{BASE_FOOD_GENERATION} de nourriture, avec un facteur de 1.2
							{BASE_WOOD_GENERATION} de bois, avec un facteur de 1
						</li>
						<li>
							en hiver<br />
							{BASE_FOOD_GENERATION} de nourriture, avec un facteur de 0.5
							{BASE_WOOD_GENERATION} de bois, avec un facteur de 0.75
						</li>
					</ol>
				</li>
			</ul>
		</ListItem>
	</List>
</div>
