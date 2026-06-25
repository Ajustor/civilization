<script lang="ts">
	import type { PageData } from './$types'
	import { Settings } from '@lucide/svelte'
	import {
		Resource,
		ResourceTypes,
		type BuildingType,
		type OccupationTypes,
		type PeopleType,
		Events
	} from '@ajustor/simulation'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import { OCCUPATIONS, resourceNames, eventsName } from '$lib/translations'
	import PeopleTable from './datatables/people-table.svelte'
	import { callGetPeople } from '../../../services/sveltekit-api/people'

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props()

	let pageIndex = $state(0)
	let pageSize = $state(10)

	const retrievePeople = async (newPageIndex: number, newPageSize: number) => {
		const oldPeople = await data.lazy.people
		pageIndex = newPageIndex
		pageSize = newPageSize
		data.lazy.people = new Promise(async (resolve) => {
			try {
				const { people } = await callGetPeople(data.civilization.id, pageIndex, pageSize)
				resolve(people)
			} catch (error) {
				console.error(error)
				resolve(oldPeople)
			}
		})
	}

	const RESOURCES_INDEXES = {
		[ResourceTypes.RAW_FOOD]: 0,
		[ResourceTypes.COOKED_FOOD]: 1,
		[ResourceTypes.WOOD]: 2,
		[ResourceTypes.STONE]: 3,
		[ResourceTypes.PLANK]: 4,
		[ResourceTypes.CHARCOAL]: 5
	}

	const jobColors = [
		'oklch(0.52 0.1 130)', 'oklch(0.55 0.1 110)', 'oklch(0.6 0.04 60)',
		'oklch(0.5 0.09 70)', 'oklch(0.6 0.1 50)', 'oklch(0.5 0.08 90)',
		'oklch(0.5 0.02 250)', 'oklch(0.55 0.11 45)'
	]

	const maxResourceQty = $derived(Math.max(...data.civilization.resources.map(r => r.quantity), 1))

	const stringToColour = (str: string) => {
		let hash = 0
		for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
		let colour = '#'
		for (let i = 0; i < 3; i++) {
			const value = (hash >> (i * 8)) & 0xff
			colour += ('00' + value.toString(16)).substr(-2)
		}
		return colour
	}
</script>

<div class="civ-page-wrapper">
	<!-- Back button -->
	<a href="/my-civilizations" style="background:none; border:none; cursor:pointer; font-family:'EB Garamond',serif; font-size:16px; color:oklch(0.5 0.06 40); padding:0; margin-bottom:14px; display:inline-block; text-decoration:none; animation:screenIn .4s ease both;">‹ Retour aux civilisations</a>

	<div class="civ-card" style="animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
		<!-- Civ header -->
		<div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:20px; border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px;">
			<div>
				<h1 style="font-family:'Marcellus',serif; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">{data.civilization.name}</h1>
				<div style="font-size:18px; color:oklch(0.46 0.03 50); margin-top:4px;">Prospère depuis {~~(data.civilization.livedMonths / 12)} ans et {data.civilization.livedMonths % 12} mois</div>
			</div>
			<div style="display:flex; gap:26px; text-align:center; align-items:center;">
				<div>
					<div style="font-family:'Marcellus',serif; font-size:32px; color:oklch(0.42 0.09 150);">{data.civilization.citizensCount}</div>
					<div style="font-size:14px; color:oklch(0.5 0.03 50);">citoyens</div>
				</div>
				<div>
					<div style="font-family:'Marcellus',serif; font-size:32px; color:oklch(0.45 0.1 38);">{data.civilization.buildings.reduce((a, b) => a + b.count, 0)}</div>
					<div style="font-size:14px; color:oklch(0.5 0.03 50);">bâtiments</div>
				</div>
				{#if data.worldId}
					<a href="/worlds/{data.worldId}/market" style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; text-decoration:none;">
						Marché
					</a>
				{/if}
				<a href="/my-civilizations/{data.civilization.id}/config" style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; background:none; color:oklch(0.45 0.06 40); font-family:'EB Garamond',serif; font-size:15px; text-decoration:none;">
					<Settings size="16" /> Configurer
				</a>
			</div>
		</div>

		<!-- Charts -->
		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:24px;">
			{#await data.lazy.stats.civilization}
				<div style="height:180px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
				<div style="height:180px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then civilizationStats}
				{@const resources = civilizationStats.map(({ resources }) => resources)}
				{@const peoples = civilizationStats.map(({ people }) => people)}
				{@const labels = civilizationStats.map(({ month, event }) => `M${month}${event ? ` (${eventsName[event as Events]})` : ''}`)}

				{#if resources.length}
					<div class="civ-inner-card">
						<h2 class="civ-section-title">Progression des ressources</h2>
						{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
							<Line
								data={{
									labels,
									datasets: resources.reduce<{ data: number[]; label: string; type: string }[]>(
										(datasets, civResources) => {
											for (const resource of civResources) {
												if (!resource?.resourceType) continue
												datasets[RESOURCES_INDEXES[resource.resourceType as ResourceTypes]] ??= {
													data: [], label: resourceNames[resource.resourceType as ResourceTypes], type: 'line'
												}
												datasets[RESOURCES_INDEXES[resource.resourceType as ResourceTypes]].data.push(resource.quantity ?? 0)
											}
											return datasets
										}, []
									)
								}}
							/>
						{/await}
					</div>
				{/if}

				{#if peoples.length}
					<div class="civ-inner-card">
						<h2 class="civ-section-title">Progression de la population</h2>
						{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
							<Line
								data={{
									labels,
									datasets: peoples.reduce<{ data: number[]; type: string; label: string }[]>(
										(datasets, d) => {
											datasets[0] ??= { data: [], type: 'line', label: 'Hommes' }
											datasets[1] ??= { data: [], type: 'line', label: 'Femmes' }
											datasets[2] ??= { data: [], type: 'line', label: 'Femmes enceintes' }
											datasets[0].data.push(d?.men ?? 0)
											datasets[1].data.push(d?.women ?? 0)
											datasets[2].data.push(d?.pregnantWomen ?? 0)
											return datasets
										}, []
									)
								}}
							/>
						{/await}
					</div>
				{/if}
			{/await}
		</div>

		<!-- Jobs + Gender ratio -->
		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:20px;">
			{#await data.lazy.stats.jobs}
				<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then jobs}
				<div class="civ-inner-card">
					<h2 class="civ-section-title">Répartition des métiers</h2>
					<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px 32px;">
						{#each Object.entries(jobs).sort(([,a],[,b]) => (b as number)-(a as number)) as [key, count], i}
							{@const total = Object.values(jobs).reduce((a: number, b) => a + (b as number), 0)}
							<div>
								<div style="display:flex; justify-content:space-between; font-size:16px; margin-bottom:4px;">
									<span>{OCCUPATIONS[key as OccupationTypes]}</span>
									<span style="color:oklch(0.5 0.03 50);">{count as number}</span>
								</div>
								<div class="civ-progress-bar">
									<div class="civ-progress-fill" style="width:{total > 0 ? Math.round(((count as number)/total)*100) : 0}%; background:{jobColors[i % jobColors.length]};"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/await}

			{#await data.lazy.stats.peopleRatio}
				<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then peopleRatio}
				{#if peopleRatio}
					<div class="civ-inner-card" style="display:flex; flex-direction:column; align-items:center;">
						<h2 class="civ-section-title" style="align-self:flex-start;">Rapport homme/femme</h2>
						{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
							<Doughnut
								data={{
									labels: ['Hommes', 'Femmes', 'Femmes enceintes'],
									datasets: [{
										data: [
											peopleRatio.menAndWomen.men,
											peopleRatio.menAndWomen.women - peopleRatio.pregnantWomen,
											peopleRatio.pregnantWomen
										]
									}]
								}}
							/>
						{/await}
					</div>
				{/if}
			{/await}
		</div>

		<!-- Resources -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<h2 class="civ-section-title">Ressources actuelles</h2>
			<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px 32px;">
				{#each data.civilization.resources as resource}
					<div>
						<div style="display:flex; justify-content:space-between; font-size:16px; margin-bottom:4px;">
							<span>{resourceNames[resource.type]}</span>
							<span style="color:oklch(0.5 0.03 50);">{resource.quantity}</span>
						</div>
						<div class="civ-progress-bar">
							<div class="civ-progress-fill" style="width:{Math.round((resource.quantity / maxResourceQty) * 100)}%; background:oklch(0.55 0.1 130);"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- People table -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<h2 class="civ-section-title">Citoyens ({data.civilization.citizensCount} au total)</h2>
			{#await data.lazy.people}
				<div style="height:120px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then people}
				<PeopleTable
					{people}
					totalPeople={data.civilization.citizensCount ?? 0}
					updateData={retrievePeople}
					{pageIndex}
					{pageSize}
				/>
			{:catch}
				<p style="color:oklch(0.5 0.03 50); font-size:15px;">Impossible de charger la liste des citoyens.</p>
			{/await}
		</div>

		<!-- Buildings table -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<h2 class="civ-section-title">Bâtiments ({data.civilization.buildings.reduce((a, { count }) => a + count, 0)} au total)</h2>
			<BuildingsTable buildings={data.civilization.buildings} />
		</div>
	</div>
</div>
