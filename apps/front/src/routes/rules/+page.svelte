<script lang="ts">
	import { Block, List, ListItem } from 'konsta/svelte'
</script>

<Block class="m-auto flex flex-col items-center justify-center lg:w-3/4">
	<h1 class="text-2xl">Les règles de la simulation</h1>
	<List strong inset>
		<ListItem title="Les règles du monde">
			<ul slot="inner" class="list-disc">
				<li>Toutes les heures un mois passe</li>
				<li>
					Tous les mois les citoyens doivent manger et avoir un logement afin de gagner de la vie
				</li>
				<li>Un citoyen qui atteint l'age de 91 ans meurt</li>
				<li>
					Les citoyens peuvent se reproduire tous les mois si leur santé est d'au moins de 8 et
					qu'ils ont entre 16 et 60 ans
				</li>
				<li>
					Chaque citoyen a un métier dans la liste suivante :
					<ol class="list-inside list-decimal">
						<li>Fermier (travaille de 4 à 70 ans et consome 1 de nourriture)</li>
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
							au printemps<br /> 50 de nourriture avec un bonus de 20 par civilisations active
						</li>
						<li>en été<br /> 25 de nourriture avec un bonus de 10 par civilisations active</li>
						<li>
							en automne<br /> 10 de nourriture avec un bonus de 5 par civilisations active et 10 de
							bois
						</li>
						<li>en hiver<br />20 de bois</li>
					</ol>
				</li>
			</ul>
		</ListItem>
	</List>
</Block>
