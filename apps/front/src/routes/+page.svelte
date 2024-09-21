<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import type { CarouselAPI } from '$lib/components/ui/carousel/context'
	import { Gender, getSeason } from '@ajustor/simulation'
	import Doughnut from '$lib/components/charts/Doughnut.svelte'
	import { Carrot, FlameKindling, Cuboid } from 'lucide-svelte'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import { resourceNames, seasonsTranslations } from '$lib/translations'
	import { getWorldStats } from '../services/api/world-api'
	import { onMount } from 'svelte'

	export let data: PageData

	let api: CarouselAPI

	let worldStatsPromises: {
		aliveCivilizations: Promise<number>
		deadCivilizations: Promise<number>
		topCivilizations: Promise<{ name: string; livedMonths: number }[]>
		menAndWomen: Promise<{ men: number; women: number }>
	} = {
		aliveCivilizations: Promise.resolve(0),
		deadCivilizations: Promise.resolve(0),
		topCivilizations: Promise.resolve([]),
		menAndWomen: Promise.resolve({ men: 0, women: 0 })
	}

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
	}

	const changeTheme = (theme: string) => {
		const mainElement = document.querySelector('html')
		if (mainElement) {
			mainElement.dataset.theme = theme
		}
	}

	const getWorldStatsPromises = (worldId: string) => {
		worldStatsPromises.aliveCivilizations = new Promise(async (resolve) => {
			const { aliveCivilizations } = await getWorldStats(worldId, { withAliveCount: true })
			resolve(aliveCivilizations ?? 0)
		})

		worldStatsPromises.deadCivilizations = new Promise(async (resolve) => {
			const { deadCivilizations } = await getWorldStats(worldId, { withDeadCount: true })
			resolve(deadCivilizations ?? 0)
		})

		worldStatsPromises.topCivilizations = new Promise(async (resolve) => {
			const { topCivilizations } = await getWorldStats(worldId, { withTopCivilizations: true })
			resolve(topCivilizations ?? [])
		})

		worldStatsPromises.menAndWomen = new Promise(async (resolve) => {
			const { menAndWomen } = await getWorldStats(worldId, { withMenAndWomenRatio: true })
			resolve(menAndWomen ?? { men: 0, women: 0 })
		})
	}

	$: if (api) {
		let selectedWorld = api.selectedScrollSnap()
		changeTheme(getSeason(data.worlds.at(selectedWorld)?.month ?? -1))
		getWorldStatsPromises(data.worlds.at(selectedWorld)?.id ?? '')

		api.on('select', () => {
			selectedWorld = api.selectedScrollSnap()
			changeTheme(getSeason(data.worlds.at(selectedWorld)?.month ?? -1))
			getWorldStatsPromises(data.worlds.at(selectedWorld)?.id ?? '')
		})
	}

	onMount(() => {
		getWorldStatsPromises(data.worlds.at(0)?.id ?? '')
	})
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
						{#await worldStatsPromises.aliveCivilizations}
							Chargement...
						{:then aliveCivilizations}
							<p>
								Il y a actuellement {aliveCivilizations} civilisation en vie
							</p>
						{/await}
						{#await worldStatsPromises.deadCivilizations}
							Chargement...
						{:then deadCivilizations}
							<p>
								et {deadCivilizations} civilisation mortes
							</p>
						{/await}
					</div>
				</div>
				<div class="card bg-neutral text-neutral-content rounded shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Top 3 des civilisations les plus anciennes</h2>

						{#await worldStatsPromises.topCivilizations}
							Chargement...
						{:then topCivilizations}
							<ol class="list-inside list-decimal">
								{#each topCivilizations as topCiv}
									<li>{topCiv.name} avec {topCiv.livedMonths} mois vécu</li>
								{:else}
									Aucune civilisation n'est présente dans le monde
								{/each}
							</ol>
						{/await}
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
				<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
					<div class="card-body">
						<h2 class="card-title">Rapport homme/femme dans le monde</h2>
						{#await worldStatsPromises.menAndWomen}
							Chargement...
						{:then { men, women }}
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
						{/await}
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
