<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import type { CarouselAPI } from '$lib/components/ui/carousel/context'
	import { getSeason } from '@ajustor/simulation'
	import Doughnut from '$lib/components/charts/Doughnut.svelte'
	import { Carrot, FlameKindling, Cuboid } from 'lucide-svelte'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import { resourceNames, seasonsTranslations } from '$lib/translations'

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
					{#await data.lazy.worldsStats}
						<div class="card skeleton rounded shadow-xl"></div>
						<div class="card skeleton rounded shadow-xl"></div>
						<div class="card skeleton h-32 w-32 rounded shadow-lg md:col-span-2"></div>
					{:then worldsStats}
						{@const worldStats = worldsStats.get(world.id)}
						plop: {worldStats}
						{#if worldStats}
							<div class="card bg-neutral text-neutral-content rounded shadow-xl">
								<div class="card-body">
									<h2 class="card-title">Information sur les civilisations</h2>
									<p>
										Il y a actuellement {worldStats.aliveCivilizations} civilisation en vie
									</p>
									<p>
										et {worldStats.deadCivilizations} civilisation mortes
									</p>
								</div>
							</div>
							<div class="card bg-neutral text-neutral-content rounded shadow-xl">
								<div class="card-body">
									<h2 class="card-title">Classement des civilisations</h2>
									{#if worldStats.topCivilizations}
										<ol class="list-inside list-decimal">
											{#each worldStats.topCivilizations as topCiv}
												<li>{topCiv.name} avec {topCiv.livedMonths} mois vécu</li>
											{:else}
												Aucune civilisation n'est présente dans le monde
											{/each}
										</ol>
									{/if}
								</div>
							</div>
							<div class="card bg-neutral text-neutral-content rounded shadow-xl md:col-span-2">
								<div class="card-body">
									<h2 class="card-title">Rapport homme/femme dans le monde</h2>

									{#if worldStats.menAndWomen}
										{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
											<Doughnut
												data={{
													labels: ['Hommes', 'Femmes'],
													datasets: [
														{
															data: [worldStats.menAndWomen.men, worldStats.menAndWomen.women]
														}
													]
												}}
											/>
										{/await}
									{/if}
								</div>
							</div>
						{/if}
					{/await}

					<div
						class="card bg-neutral text-neutral-content col-start-1 row-start-2 rounded shadow-xl"
					>
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
				</Item>
			{/each}
		{/await}
	</Content>
	<Previous variant="ghost" />
	<Next variant="ghost" />
</Root>

<style>
</style>
