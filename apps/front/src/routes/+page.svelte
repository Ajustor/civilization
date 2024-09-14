<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import type { CarouselAPI } from '$lib/components/ui/carousel/context'
	import { Gender, getSeason } from '@ajustor/simulation'
	import Doughnut from '$lib/components/charts/Doughnut.svelte'
	import { Carrot, FlameKindling, Cuboid } from 'lucide-svelte'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import { resourceNames } from '$lib/translations'

	export let data: PageData

	let api: CarouselAPI

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}

	const seasonsTranslations = {
		spring: 'printemps',
		summer: 'été',
		autumn: 'automne',
		winter: 'hiver',
		nope: "A c'est pété"
	}

	const changeTheme = (theme: string) => {
		const mainElement = document.querySelector('html')
		if (mainElement) {
			mainElement.dataset.theme = theme
		}
	}

	$: if (api) {
		let selectedWorld = api.selectedScrollSnap()
		changeTheme(getSeason(data.worlds.at(selectedWorld)?.month ?? -1))

		api.on('select', () => {
			selectedWorld = api.selectedScrollSnap()
			changeTheme(getSeason(data.worlds.at(selectedWorld)?.month ?? -1))
		})
	}
</script>

<svelte:head>
	<title>Les mondes</title>
	<meta
		name="description"
		content="Une simulation d'un monde avec des civilisations qui vivent seule"
	/>
</svelte:head>

<Root
	opts={{
		align: 'center',
		slidesToScroll: 'auto'
	}}
	class="w-full"
	bind:api
>
	<Content class="w-full">
		{#each data.worlds as world}
			<!-- content here -->
			<Item title={world.name} class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{@const topCivs = () => {
					const top = world.civilizations.sort(
						(
							{ livedMonths: firstCivilizationLivedMonths },
							{ livedMonths: secondCivilizationLivedMonths }
						) => secondCivilizationLivedMonths - firstCivilizationLivedMonths
					)
					return top.slice(0, 3) ?? []
				}}
				{@const aliveCivilizations = world.civilizations.filter(
					({ citizens }) => citizens.length
				).length}
				{@const deadCivilizations = world.civilizations.length - aliveCivilizations}
				<h2 class="text-center text-2xl md:col-span-2 lg:col-span-3">{world.name}</h2>
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Calendrier</h2>
						<p>Ce monde a {world.year} années</p>
						<p>
							Nous sommes a la saison: {seasonsTranslations[getSeason(world.month)]} (mois {world.month})
						</p>
					</div>
				</div>
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Information sur les civilisations</h2>
						<p>
							Il y a actuellement {aliveCivilizations} civilisation en vie
						</p>
						<p>
							et {deadCivilizations} civilisation mortes
						</p>
					</div>
				</div>
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Top 3 des civilisations les plus anciennes</h2>

						<ol class="list-inside list-decimal">
							{#each topCivs() as topCiv}
								<li>{topCiv.name} avec {topCiv.livedMonths} mois vécu</li>
							{:else}
								Aucune civilisation n'est présente dans le monde
							{/each}
						</ol>
					</div>
				</div>
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Les ressources du monde</h2>
						{#each world.resources as resource}
							<IconText
								iconComponent={resourceIcons[resource.type]}
								text="{resourceNames[resource.type]}: {resource.quantity} restante"
							/>
						{/each}
					</div>
				</div>
				{@const { men, women } = world.civilizations.reduce(
					(count, { citizens }) => {
						for (const citizen of citizens) {
							if (citizen.gender === Gender.MALE) {
								count.men++
							}

							if (citizen.gender === Gender.FEMALE) {
								count.women++
							}
						}
						return count
					},
					{ men: 0, women: 0 }
				)}
				<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
					<div class="card-body">
						<h2 class="card-title">Rapport homme/femme dans le monde</h2>
						<Doughnut
							data={{
								labels: ['Hommes', 'Femmes'],
								datasets: [
									{
										data: [men, women]
									}
								]
							}}
						/>
					</div>
				</div>
			</Item>
		{/each}
	</Content>
	<Previous variant="ghost" />
	<Next variant="ghost" />
</Root>

<style>
</style>
