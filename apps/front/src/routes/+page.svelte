<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import type { CarouselAPI } from '$lib/components/ui/carousel/context'
	import { getSeason } from '@ajustor/simulation'
	import Doughnut from '$lib/components/charts/Doughnut.svelte'
	import { Carrot, FlameKindling, Cuboid } from 'lucide-svelte'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import { resourceNames, seasonsTranslations } from '$lib/translations'
	import { getWorldStats } from '../services/api/world-api'

	export let data: PageData

	let api: CarouselAPI

	const resourceIcons = {
		food: Carrot,
		wood: FlameKindling,
		stone: Cuboid
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
	class="w-full overflow-hidden"
	bind:api
>
	<Content class="ml-0 mr-0 w-full">
		{#await data.worlds then worlds}
			<!-- promise was fulfilled -->
			{#each worlds as world}
				<!-- content here -->
				<Item title={world.name} class="grid grid-cols-1 gap-4 pl-0 md:grid-cols-2 lg:grid-cols-3">
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
							{#await getWorldStats(world.id, { withAliveCount: true })}
								<span class="loading loading-infinity loading-lg"></span>
							{:then { aliveCivilizations }}
								<p>
									Il y a actuellement {aliveCivilizations} civilisation en vie
								</p>
							{/await}
							{#await getWorldStats(world.id, { withDeadCount: true })}
								<span class="loading loading-infinity loading-lg"></span>
							{:then { deadCivilizations }}
								<p>
									et {deadCivilizations} civilisation mortes
								</p>
							{/await}
						</div>
					</div>
					<div class="card bg-neutral text-neutral-content rounded shadow-xl">
						<div class="card-body">
							<h2 class="card-title">Top 3 des civilisations les plus anciennes</h2>

							{#await getWorldStats(world.id, { withTopCivilizations: true })}
								<span class="loading loading-infinity loading-lg"></span>
							{:then { topCivilizations }}
								{#if topCivilizations}
									<ol class="list-inside list-decimal">
										{#each topCivilizations as topCiv}
											<li>{topCiv.name} avec {topCiv.livedMonths} mois vécu</li>
										{:else}
											Aucune civilisation n'est présente dans le monde
										{/each}
									</ol>
								{/if}
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
							{#await getWorldStats(world.id, { withMenAndWomenRatio: true })}
								<span class="loading loading-infinity loading-lg"></span>
							{:then { menAndWomen }}
								{#if menAndWomen}
									{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
										<Doughnut
											data={{
												labels: ['Hommes', 'Femmes'],
												datasets: [
													{
														data: [menAndWomen.men, menAndWomen.women]
													}
												]
											}}
										/>
									{/await}
								{/if}
							{/await}
						</div>
					</div>
				</Item>
			{/each}
		{/await}
	</Content>
	<Previous variant="ghost" />
	<Next variant="ghost" />
</Root>

<style>
</style>
