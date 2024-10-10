<script lang="ts">
	import type { PageData } from './$types'
	import { Root, Content, Item, Next, Previous } from '$lib/components/ui/carousel'
	import type { CarouselAPI } from '$lib/components/ui/carousel/context'
	import { getSeason } from '@ajustor/simulation'
	import IconText from '$lib/components/IconText/icon-text.svelte'
	import {
		eventsDescription,
		eventsName,
		resourceIcons,
		resourceNames,
		seasonsTranslations
	} from '$lib/translations'
	import Icon from '@iconify/svelte'

	export let data: PageData

	let api: CarouselAPI
</script>

<svelte:head>
	<title>Les mondes</title>
	<meta
		name="description"
		content="Une simulation d'un monde avec des civilisations qui vivent seule"
	/>
</svelte:head>

<a
	class="btn"
	href="https://discord.gg/fJUvvX3www"
	aria-label="Lien d'invitation au serveur discord"
	target="_blank"
>
	<Icon icon="logos:discord-icon" /> Rejoindre le discord
</a>

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
					<div class="card rounded bg-neutral text-neutral-content shadow-xl">
						<div class="card-body">
							<h2 class="card-title">Calendrier</h2>
							<p>Ce monde a {world.year} années</p>
							<p>
								Nous sommes a la saison: {seasonsTranslations[getSeason(world.month)]} (mois {world.month})
							</p>

							{#if world.nextEvent}
								<p>
									Le prochain événement est: <span
										class="tooltip tooltip-top tooltip-accent"
										data-tip={eventsDescription[world.nextEvent]}
									>
										{eventsName[world.nextEvent]}
									</span>
								</p>
							{/if}
						</div>
					</div>
					{#await data.lazy.worldsStats}
						<div class="card skeleton rounded shadow-xl"></div>
					{:then worldsStats}
						{@const worldStats = worldsStats.get(world.id)}
						{#if worldStats}
							{#await worldStats.aliveCivilizations}
								<div class="card skeleton rounded shadow-xl"></div>
							{:then aliveCivilizations}
								{#await worldStats.deadCivilizations}
									<div class="card skeleton rounded shadow-xl"></div>
								{:then deadCivilizations}
									<!-- promise was fulfilled -->
									<div class="card rounded bg-neutral text-neutral-content shadow-xl">
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
								{/await}
							{/await}

							{#await worldStats.topCivilizations}
								<div class="card skeleton rounded shadow-xl"></div>
							{:then topCivilizations}
								{#if topCivilizations}
									<div class="card rounded bg-neutral text-neutral-content shadow-xl">
										<div class="card-body">
											<h2 class="card-title">Classement des civilisations</h2>
											{#if worldStats.topCivilizations}
												<ol class="list-inside list-decimal">
													{#each topCivilizations as topCiv}
														<li>{topCiv.name} avec {topCiv.livedMonths} mois vécu</li>
													{:else}
														Aucune civilisation n'est présente dans le monde
													{/each}
												</ol>
											{/if}
										</div>
									</div>
								{/if}
							{/await}

							{#await worldStats.menAndWomen}
								<div class="card skeleton h-32 w-32 rounded shadow-lg md:col-span-2"></div>
							{:then menAndWomenRatio}
								{#if menAndWomenRatio}
									<div class="card rounded bg-neutral text-neutral-content shadow-xl md:col-span-2">
										<div class="card-body">
											<h2 class="card-title">Rapport homme/femme dans le monde</h2>

											{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
												<Doughnut
													data={{
														labels: ['Hommes', 'Femmes'],
														datasets: [
															{
																data: [menAndWomenRatio.men, menAndWomenRatio.women]
															}
														]
													}}
												/>
											{/await}
										</div>
									</div>
								{/if}
							{/await}
						{/if}
					{/await}

					<div
						class="card col-start-1 row-start-2 rounded bg-neutral text-neutral-content shadow-xl"
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
