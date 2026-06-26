<script lang="ts">
	import type { PageData } from './$types'
	import { Settings, ZoomIn, Hammer } from '@lucide/svelte'
	import {
		Resource,
		ResourceTypes,
		type BuildingType,
		BuildingTypes,
		type OccupationTypes,
		type PeopleType,
		Events
	} from '@ajustor/simulation'
	import BuildingsTable from './datatables/buildings-table.svelte'
	import { OCCUPATIONS, resourceNames, eventsName, eventsDescription, buildingNames } from '$lib/translations'
	import PeopleTable from './datatables/people-table.svelte'
	import Breadcrumb from '$lib/components/Breadcrumb.svelte'
	import { callGetPeople } from '../../../services/sveltekit-api/people'
	import { callGetStats } from '../../../services/sveltekit-api/civilization'
	import { onMount } from 'svelte'
	import { invalidateAll } from '$app/navigation'
	import { PUBLIC_BACK_URL } from '$env/static/public'
	import RecapModal from '$lib/components/RecapModal.svelte'
	import { callGetRecap } from '../../../services/sveltekit-api/recap'
	import type { RecapData } from '@ajustor/civ-api'

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props()

	let pageIndex = $state(0)
	let pageSize = $state(10)
	// Drive the citizens table from local state: reassigning the SvelteKit `data`
	// prop's nested promise is NOT reactive in Svelte 5, so the table never updated.
	let peoplePromise = $state<Promise<PeopleType[]>>(data.lazy.people)
	let recap = $state<RecapData | null>(null)

	// Same reasoning as `peoplePromise`: the server-streamed stat promises captured
	// here are not reactive, so the charts/combat-log never refreshed live. We hold
	// them in local state and re-fetch via the client `/stats` endpoint on refresh.
	let statsPromise = $state(data.lazy.stats.civilization)
	let jobsPromise = $state(data.lazy.stats.jobs)
	let peopleRatioPromise = $state(data.lazy.stats.peopleRatio)
	let combatLogsPromise = $state(data.lazy.combatLogs)

	const refreshStats = () => {
		const stats = callGetStats(data.civilization.id)
		statsPromise = stats.then((s) => s.civilization)
		jobsPromise = stats.then((s) => s.jobs)
		peopleRatioPromise = stats.then((s) => s.peopleRatio)
		combatLogsPromise = stats.then((s) => s.combatLogs)
	}

	// Which panel is expanded: null = closed
	type Panel = 'resources' | 'population' | 'jobs' | 'gender' | null
	let activePanel = $state<Panel>(null)

	const openPanel = (p: Panel) => { activePanel = p }
	const closePanel = () => { activePanel = null }

	const retrievePeople = async (newPageIndex: number, newPageSize: number) => {
		const previous = peoplePromise
		pageIndex = newPageIndex
		pageSize = newPageSize
		peoplePromise = (async () => {
			try {
				const { people } = await callGetPeople(data.civilization.id, newPageIndex, newPageSize)
				return people
			} catch (error) {
				console.error(error)
				return previous
			}
		})()
	}

	// Live refresh: the world advances a month every ~15 min server-side.
	onMount(() => {
		// Récap "pendant ton absence" : récupéré une seule fois (pas via load, donc
		// non rejoué par l'auto-refresh). Marque la période vue côté serveur. Placé
		// avant le retour anticipé worldId pour fonctionner même pour une civ hors monde.
		void callGetRecap(data.civilization.id)
			.then((result) => {
				if (result?.hasRecap) {
					recap = result
				}
			})
			.catch((error) => console.error(error))

		if (!data.worldId) {
			return
		}
		const worldId = data.worldId

		const refresh = async () => {
			// Refresh top-level civilization data (current resources, building/people
			// counts) via invalidation, re-fetch the citizens page currently shown, and
			// pull fresh chart/combat-log stats into local state.
			await invalidateAll()
			retrievePeople(pageIndex, pageSize)
			refreshStats()
		}

		// Primary path: SSE push as soon as the world advances a month.
		const source = new EventSource(`${PUBLIC_BACK_URL}/worlds/${worldId}/events`)
		source.addEventListener('month', () => {
			void refresh()
		})

		// Fallback: poll the world's month in case SSE is blocked/buffered by a
		// reverse proxy. Cheap endpoint, only triggers a refresh on an actual change.
		let knownMonth: number | null = null
		const poll = setInterval(async () => {
			try {
				const response = await fetch(`${PUBLIC_BACK_URL}/worlds/${worldId}/month`)
				if (!response.ok) {
					return
				}
				const { month } = await response.json()
				if (knownMonth !== null && month !== knownMonth) {
					void refresh()
				}
				knownMonth = month
			} catch (error) {
				console.error(error)
			}
		}, 60_000)

		return () => {
			source.close()
			clearInterval(poll)
		}
	})

	const RESOURCES_INDEXES = {
		[ResourceTypes.RAW_FOOD]: 0,
		[ResourceTypes.COOKED_FOOD]: 1,
		[ResourceTypes.WOOD]: 2,
		[ResourceTypes.STONE]: 3,
		[ResourceTypes.PLANK]: 4,
		[ResourceTypes.CHARCOAL]: 5
	}

	// Build dense, label-aligned line datasets for the resource charts.
	// Indexing a sparse array by RESOURCES_INDEXES used to leave holes (undefined
	// slots) whenever a resource type was absent — e.g. a civ that has charcoal but
	// no planks. Chart.js chokes on those holes and the chart silently fails to
	// render (which then breaks the zoom panel). Here we emit exactly one dataset
	// per resource type that ever appears, with one value per tracked month (0 when
	// missing) so every series stays aligned with the month labels.
	const buildResourceDatasets = (
		stats: { resources: { resourceType?: ResourceTypes; quantity?: number }[] }[]
	) =>
		(Object.entries(RESOURCES_INDEXES) as [ResourceTypes, number][])
			.sort(([, a], [, b]) => a - b)
			.map(([resourceType]) => resourceType)
			.filter((resourceType) =>
				stats.some(({ resources }) => resources.some((r) => r?.resourceType === resourceType))
			)
			.map((resourceType) => ({
				type: 'line' as const,
				label: resourceNames[resourceType],
				data: stats.map(
					({ resources }) => resources.find((r) => r?.resourceType === resourceType)?.quantity ?? 0
				)
			}))

	const jobColors = [
		'oklch(0.52 0.1 130)', 'oklch(0.55 0.1 110)', 'oklch(0.6 0.04 60)',
		'oklch(0.5 0.09 70)', 'oklch(0.6 0.1 50)', 'oklch(0.5 0.08 90)',
		'oklch(0.5 0.02 250)', 'oklch(0.55 0.11 45)'
	]

	// Storage capacity per resource = (number of Entrepôts) × the cache's per-resource
	// max. Values mirror the Cache building in the simulation (buildings/cache.ts).
	const STORAGE_PER_CACHE: Record<ResourceTypes, number> = {
		[ResourceTypes.RAW_FOOD]: 300,
		[ResourceTypes.COOKED_FOOD]: 100,
		[ResourceTypes.WOOD]: 150,
		[ResourceTypes.STONE]: 300,
		[ResourceTypes.PLANK]: 150,
		[ResourceTypes.CHARCOAL]: 150
	}
	const RESOURCE_COLORS: Record<ResourceTypes, string> = {
		[ResourceTypes.RAW_FOOD]: 'oklch(0.58 0.13 135)',
		[ResourceTypes.COOKED_FOOD]: 'oklch(0.62 0.13 60)',
		[ResourceTypes.WOOD]: 'oklch(0.5 0.08 55)',
		[ResourceTypes.STONE]: 'oklch(0.55 0.02 250)',
		[ResourceTypes.PLANK]: 'oklch(0.62 0.07 85)',
		[ResourceTypes.CHARCOAL]: 'oklch(0.42 0.02 250)'
	}
	const OVERFLOW_COLOR = 'oklch(0.55 0.2 28)'
	const cacheCount = $derived(
		data.civilization.buildings
			.filter((b) => b.type === BuildingTypes.CACHE)
			.reduce((sum, b) => sum + b.count, 0)
	)

	// ── Constructions en cours ─────────────────────────────────────────────────
	// Group pending constructions by building type, and within each type by the
	// number of months remaining, so a player sees how many of each building are
	// coming and when.
	type PendingGroup = {
		buildingType: BuildingTypes
		count: number
		breakdown: { monthsRemaining: number; count: number }[]
	}
	const pendingConstructions = $derived<{ buildingType: BuildingTypes; monthsRemaining: number }[]>(
		data.civilization.pendingConstructions ?? []
	)
	const pendingGroups = $derived<PendingGroup[]>(
		Object.values(
			pendingConstructions.reduce<Record<string, PendingGroup>>((acc, { buildingType, monthsRemaining }) => {
				const group = (acc[buildingType] ??= { buildingType, count: 0, breakdown: [] })
				group.count++
				const slot = group.breakdown.find((b) => b.monthsRemaining === monthsRemaining)
				if (slot) {
					slot.count++
				} else {
					group.breakdown.push({ monthsRemaining, count: 1 })
				}
				return acc
			}, {})
		)
			.map((group) => ({
				...group,
				breakdown: group.breakdown.sort((a, b) => a.monthsRemaining - b.monthsRemaining)
			}))
			.sort((a, b) => b.count - a.count)
	)
	const monthsLabel = (monthsRemaining: number) =>
		monthsRemaining <= 0
			? 'Bientôt prête'
			: monthsRemaining === 1
				? 'Prête le mois prochain'
				: `Prête dans ${monthsRemaining} mois`

	// ── Stat helpers ──────────────────────────────────────────────────────────
	const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')
	const pct = (n: number, total: number) => total > 0 ? Math.round(n / total * 100) : 0
	const trendArrow = (d: number) => d > 0 ? '▲' : d < 0 ? '▼' : '─'
	const trendColor = (d: number) => d > 0 ? 'oklch(0.42 0.12 140)' : d < 0 ? 'oklch(0.48 0.16 30)' : 'oklch(0.5 0.03 50)'
	const signedFmt = (d: number) => (d > 0 ? '+' : '') + fmt(d)

	const CHART_OPTS = { maintainAspectRatio: false, responsive: true }
</script>

<!-- ── Récap "pendant ton absence" ─────────────────────────────────────────── -->
{#if recap}
	<RecapModal {recap} onClose={() => (recap = null)} />
{/if}

<!-- ── Modal backdrop ──────────────────────────────────────────────────────── -->
{#if activePanel}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
	<div
		role="presentation"
		style="position:fixed; inset:0; z-index:60; background:rgba(24,14,4,.65); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px;"
		onclick={closePanel}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closePanel()}
			style="background:radial-gradient(circle at 20% 10%, rgba(150,110,60,.08), transparent 50%), oklch(0.95 0.022 84); border:1px solid oklch(0.74 0.05 60); box-shadow:inset 0 0 0 5px oklch(0.93 0.03 84), inset 0 0 0 6px oklch(0.72 0.05 60), 0 24px 64px rgba(40,20,4,.5); border-radius:5px; width:min(96vw, 1040px); max-height:88vh; overflow-y:auto; display:flex; flex-direction:column;"
		>
			<!-- Modal header -->
			<div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; border-bottom:2px solid oklch(0.76 0.05 60); flex-shrink:0;">
				<div>
					<div style="font-size:11px; letter-spacing:.12em; color:oklch(0.55 0.05 50); text-transform:uppercase; margin-bottom:4px;">Analyse détaillée · {data.civilization.name}</div>
					<h2 style="font-family:'Marcellus',serif; font-size:22px; margin:0; color:oklch(0.3 0.04 40);">
						{#if activePanel === 'resources'}Progression des ressources
						{:else if activePanel === 'population'}Progression de la population
						{:else if activePanel === 'jobs'}Répartition des métiers
						{:else if activePanel === 'gender'}Rapport homme / femme
						{/if}
					</h2>
				</div>
				<button onclick={closePanel} style="background:none; border:1px solid oklch(0.74 0.05 60); border-radius:4px; padding:8px 14px; cursor:pointer; font-size:18px; color:oklch(0.5 0.04 50); line-height:1;">✕</button>
			</div>

			<!-- Modal body -->
			<div style="flex:1; overflow-y:auto; padding:24px;">

				<!-- ── RESOURCES panel ──────────────────────────────────────── -->
				{#if activePanel === 'resources'}
					{#await statsPromise}
						<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
					{:then civilizationStats}
						{@const last = civilizationStats[civilizationStats.length - 1]}
						{@const prev = civilizationStats[civilizationStats.length - 2]}
						{@const events = civilizationStats.filter(s => s.event)}
						{@const labels = civilizationStats.map(({ month, event }) => `M${month}${event ? ` (${eventsName[event as Events]})` : ''}`)}
						{@const datasets = buildResourceDatasets(civilizationStats)}
						<div style="display:grid; grid-template-columns:260px 1fr; gap:20px;">
							<!-- Stats panel -->
							<div style="background:oklch(0.91 0.025 78); border:1px solid oklch(0.78 0.045 70); border-radius:4px; padding:16px 18px; display:flex; flex-direction:column; gap:12px;">
								<div>
									<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Informations</div>
									<div style="display:grid; grid-template-columns:1fr auto; gap:4px 12px; font-size:14px;">
										<span style="color:oklch(0.5 0.04 50);">Mois suivis</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{civilizationStats.length}</span>
										<span style="color:oklch(0.5 0.04 50);">Dernier mois</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">M{last?.month ?? '─'}</span>
										<span style="color:oklch(0.5 0.04 50);">Événements</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{events.length}</span>
									</div>
								</div>
								<div style="border-top:1px solid oklch(0.8 0.04 70); padding-top:12px;">
									<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Ressources actuelles</div>
									{#each Object.entries(RESOURCES_INDEXES).sort(([,a],[,b]) => a-b) as [rType, idx]}
										{@const curQty = last?.resources.find(r => r.resourceType === rType)?.quantity ?? 0}
										{@const prevQty = prev?.resources.find(r => r.resourceType === rType)?.quantity ?? 0}
										{@const d = curQty - prevQty}
										<div style="display:grid; grid-template-columns:1fr auto auto; gap:2px 10px; align-items:baseline; padding:4px 0; border-bottom:1px solid oklch(0.86 0.03 76);">
											<span style="font-size:14px; color:oklch(0.45 0.04 48);">{resourceNames[rType as ResourceTypes]}</span>
											<span style="font-size:15px; font-weight:600; color:oklch(0.3 0.04 40);">{fmt(curQty)}</span>
											<span style="font-size:12px; color:{trendColor(d)};">{trendArrow(d)} {signedFmt(d)}</span>
										</div>
									{/each}
								</div>
								{#if events.length}
									<div style="border-top:1px solid oklch(0.8 0.04 70); padding-top:12px;">
										<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Événements survenus</div>
										{#each events as ev}
											<div style="font-size:13px; padding:4px 0; border-bottom:1px solid oklch(0.88 0.03 76);">
												<span style="color:oklch(0.48 0.08 40);">M{ev.month}</span>
												<span style="color:oklch(0.5 0.04 50); margin:0 6px;">—</span>
												<span style="color:oklch(0.35 0.04 40);">{eventsName[ev.event as Events]}</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
							<!-- Chart -->
							<div style="display:flex; flex-direction:column; gap:12px;">
								<div style="position:relative; height:380px;">
									{#if datasets.length}
										{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
											<Line data={{ labels, datasets }} options={CHART_OPTS} />
										{/await}
									{:else}
										<div style="height:100%; display:flex; align-items:center; justify-content:center; color:oklch(0.5 0.03 50);">Pas encore de données historiques</div>
									{/if}
								</div>
							</div>
						</div>
					{/await}

				<!-- ── POPULATION panel ──────────────────────────────────────── -->
				{:else if activePanel === 'population'}
					{#await statsPromise}
						<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
					{:then civilizationStats}
						{@const last = civilizationStats[civilizationStats.length - 1]}
						{@const first = civilizationStats[0]}
						{@const labels = civilizationStats.map(({ month, event }) => `M${month}${event ? ` (${eventsName[event as Events]})` : ''}`)}
						{@const datasets = civilizationStats.reduce<{ data: number[]; type: string; label: string }[]>(
							(acc, { people: p }) => {
								acc[0] ??= { data: [], type: 'line', label: 'Hommes' }
								acc[1] ??= { data: [], type: 'line', label: 'Femmes' }
								acc[2] ??= { data: [], type: 'line', label: 'Femmes enceintes' }
								acc[0].data.push(p?.men ?? 0)
								acc[1].data.push(p?.women ?? 0)
								acc[2].data.push(p?.pregnantWomen ?? 0)
								return acc
							}, []
						)}
						{@const peakEntry = civilizationStats.reduce((best, s) => {
							const total = (s.people?.men ?? 0) + (s.people?.women ?? 0)
							const bestTotal = (best?.people?.men ?? 0) + (best?.people?.women ?? 0)
							return total > bestTotal ? s : best
						}, civilizationStats[0])}
						{@const curTotal = (last?.people?.men ?? 0) + (last?.people?.women ?? 0)}
						{@const firstTotal = (first?.people?.men ?? 0) + (first?.people?.women ?? 0)}
						{@const growth = curTotal - firstTotal}
						<div style="display:grid; grid-template-columns:260px 1fr; gap:20px;">
							<!-- Stats panel -->
							<div style="background:oklch(0.91 0.025 78); border:1px solid oklch(0.78 0.045 70); border-radius:4px; padding:16px 18px; display:flex; flex-direction:column; gap:12px;">
								<div>
									<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Population actuelle</div>
									<div style="display:grid; grid-template-columns:1fr auto auto; gap:4px 10px; font-size:14px; align-items:baseline;">
										<span style="color:oklch(0.5 0.04 50);">Total</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{fmt(curTotal)}</span>
										<span></span>
										<span style="color:oklch(0.5 0.04 50);">Hommes</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{fmt(last?.people?.men ?? 0)}</span>
										<span style="color:oklch(0.5 0.04 50); font-size:12px;">{pct(last?.people?.men ?? 0, curTotal)}%</span>
										<span style="color:oklch(0.5 0.04 50);">Femmes</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{fmt(last?.people?.women ?? 0)}</span>
										<span style="color:oklch(0.5 0.04 50); font-size:12px;">{pct(last?.people?.women ?? 0, curTotal)}%</span>
										<span style="color:oklch(0.5 0.04 50); padding-left:10px;">dont enceintes</span>
										<span style="color:oklch(0.32 0.04 40);">{fmt(last?.people?.pregnantWomen ?? 0)}</span>
										<span style="color:oklch(0.5 0.04 50); font-size:12px;">{pct(last?.people?.pregnantWomen ?? 0, last?.people?.women ?? 1)}%</span>
									</div>
								</div>
								<div style="border-top:1px solid oklch(0.8 0.04 70); padding-top:12px;">
									<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Évolution</div>
									<div style="display:grid; grid-template-columns:1fr auto; gap:4px 10px; font-size:14px;">
										<span style="color:oklch(0.5 0.04 50);">Début suivi</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{fmt(firstTotal)}</span>
										<span style="color:oklch(0.5 0.04 50);">Progression</span>
										<span style="color:{trendColor(growth)}; font-weight:600;">{trendArrow(growth)} {signedFmt(growth)} ({pct(Math.abs(growth), firstTotal || 1)}%)</span>
										<span style="color:oklch(0.5 0.04 50);">Pic</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{fmt((peakEntry?.people?.men ?? 0) + (peakEntry?.people?.women ?? 0))} (M{peakEntry?.month})</span>
										<span style="color:oklch(0.5 0.04 50);">Mois suivis</span>
										<span style="color:oklch(0.32 0.04 40); font-weight:600;">{civilizationStats.length}</span>
									</div>
								</div>
							</div>
							<!-- Chart -->
							<div style="position:relative; height:380px;">
								{#if datasets.length}
									{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
										<Line data={{ labels, datasets }} options={CHART_OPTS} />
									{/await}
								{:else}
									<div style="height:100%; display:flex; align-items:center; justify-content:center; color:oklch(0.5 0.03 50);">Pas encore de données historiques</div>
								{/if}
							</div>
						</div>
					{/await}

				<!-- ── JOBS panel ──────────────────────────────────────────────── -->
				{:else if activePanel === 'jobs'}
					{#await jobsPromise}
						<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
					{:then jobs}
						{@const entries = Object.entries(jobs).filter(([k]) => k !== 'child').sort(([,a],[,b]) => (b as number)-(a as number))}
						{@const total = entries.reduce((s: number, [, v]) => s + (v as number), 0)}
						<div style="display:flex; flex-direction:column; gap:8px;">
							<div style="display:grid; grid-template-columns:180px 1fr auto auto; gap:6px 16px; align-items:center; padding:8px 0; border-bottom:2px solid oklch(0.78 0.04 70); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:oklch(0.52 0.05 50);">
								<span>Métier</span><span>Proportion</span><span>Effectif</span><span>Part</span>
							</div>
							{#each entries as [key, count], i}
								{@const share = pct(count as number, total)}
								<div style="display:grid; grid-template-columns:180px 1fr auto auto; gap:6px 16px; align-items:center; padding:10px 0; border-bottom:1px solid oklch(0.88 0.03 70);">
									<span style="font-size:15px; color:oklch(0.36 0.04 42);">{OCCUPATIONS[key as OccupationTypes] ?? key}</span>
									<div style="background:oklch(0.88 0.025 78); border-radius:2px; height:10px; overflow:hidden;">
										<div style="height:100%; width:{share}%; background:{jobColors[i % jobColors.length]}; transition:width .3s;"></div>
									</div>
									<span style="font-size:15px; font-weight:600; color:oklch(0.32 0.04 40); text-align:right;">{fmt(count as number)}</span>
									<span style="font-size:13px; color:oklch(0.5 0.04 50); text-align:right; min-width:36px;">{share}%</span>
								</div>
							{/each}
							<div style="text-align:right; padding-top:8px; font-size:14px; color:oklch(0.5 0.04 50);">Total : <strong style="color:oklch(0.32 0.04 40);">{fmt(total)}</strong> actifs</div>
						</div>
					{/await}

				<!-- ── GENDER panel ─────────────────────────────────────────────── -->
				{:else if activePanel === 'gender'}
					{#await peopleRatioPromise}
						<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
					{:then peopleRatio}
						{#if peopleRatio}
							{@const men = peopleRatio.menAndWomen.men}
							{@const women = peopleRatio.menAndWomen.women}
							{@const pregnant = peopleRatio.pregnantWomen}
							{@const total = men + women}
							{@const ratio = women > 0 ? (men / women).toFixed(2) : '─'}
							<div style="display:grid; grid-template-columns:260px 1fr; gap:20px; align-items:start;">
								<!-- Stats panel -->
								<div style="background:oklch(0.91 0.025 78); border:1px solid oklch(0.78 0.045 70); border-radius:4px; padding:16px 18px;">
									<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:12px;">Répartition</div>
									<div style="display:flex; flex-direction:column; gap:14px;">
										<div>
											<div style="font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:oklch(0.5 0.06 240); margin-bottom:4px;">Hommes</div>
											<div style="font-size:28px; font-family:'Tangerine',cursive; color:oklch(0.38 0.08 240);">{fmt(men)}</div>
											<div style="font-size:13px; color:oklch(0.5 0.04 50);">{pct(men, total)}% de la population</div>
										</div>
										<div style="border-top:1px solid oklch(0.82 0.03 72); padding-top:14px;">
											<div style="font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:oklch(0.5 0.06 330); margin-bottom:4px;">Femmes</div>
											<div style="font-size:28px; font-family:'Tangerine',cursive; color:oklch(0.42 0.1 330);">{fmt(women)}</div>
											<div style="font-size:13px; color:oklch(0.5 0.04 50);">{pct(women, total)}% de la population</div>
											<div style="font-size:13px; color:oklch(0.5 0.04 50); margin-top:4px;">dont enceintes : <strong style="color:oklch(0.38 0.08 130);">{fmt(pregnant)}</strong> ({pct(pregnant, women)}%)</div>
										</div>
										<div style="border-top:1px solid oklch(0.82 0.03 72); padding-top:14px;">
											<div style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:oklch(0.52 0.05 50); margin-bottom:8px;">Équilibre</div>
											<div style="display:grid; grid-template-columns:1fr auto; gap:4px 10px; font-size:14px;">
												<span style="color:oklch(0.5 0.04 50);">Rapport H/F</span>
												<span style="font-weight:600; color:oklch(0.32 0.04 40);">{ratio}</span>
												<span style="color:oklch(0.5 0.04 50);">Pour 100 femmes</span>
												<span style="font-weight:600; color:oklch(0.32 0.04 40);">{women > 0 ? Math.round(men / women * 100) : '─'} hommes</span>
												<span style="color:oklch(0.5 0.04 50);">Total</span>
												<span style="font-weight:600; color:oklch(0.32 0.04 40);">{fmt(total)}</span>
											</div>
										</div>
									</div>
								</div>
								<!-- Chart -->
								<div style="position:relative; height:340px;">
									{#await import('$lib/components/charts/Doughnut.svelte') then { default: Doughnut }}
										<Doughnut
											data={{
												labels: ['Hommes', 'Femmes', 'Femmes enceintes'],
												datasets: [{ data: [men, women - pregnant, pregnant] }]
											}}
											options={{ ...CHART_OPTS, plugins: { legend: { position: 'bottom', labels: { color: 'oklch(0.4 0.04 50)', padding: 16, font: { size: 14, family: "'EB Garamond', serif" } } } } }}
										/>
									{/await}
								</div>
							</div>
						{/if}
					{/await}
				{/if}

			</div><!-- /modal body -->
		</div><!-- /modal card -->
	</div><!-- /backdrop -->
{/if}

<!-- ── Page ─────────────────────────────────────────────────────────────────── -->
<div class="civ-page-wrapper">
	<Breadcrumb items={[
		{ label: 'Mes civilisations', href: '/my-civilizations' },
		{ label: data.civilization.name }
	]} />

	<div class="civ-card" style="animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
		<!-- Civ header -->
		<div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:20px; border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:20px;">
			<div>
				<h1 style="font-family:'Tangerine',cursive; font-size:clamp(34px,6vw,46px); margin:0; color:oklch(0.3 0.04 40);">{data.civilization.name}</h1>
				<div style="font-size:18px; color:oklch(0.46 0.03 50); margin-top:4px;">Prospère depuis {~~(data.civilization.livedMonths / 12)} ans et {data.civilization.livedMonths % 12} mois</div>
			</div>
			<div style="display:flex; gap:26px; text-align:center; align-items:center;">
				<div>
					<div style="font-family:'Tangerine',cursive; font-size:32px; color:oklch(0.42 0.09 150);">{data.civilization.citizensCount}</div>
					<div style="font-size:14px; color:oklch(0.5 0.03 50);">citoyens</div>
				</div>
				<div>
					<div style="font-family:'Tangerine',cursive; font-size:32px; color:oklch(0.45 0.1 38);">{data.civilization.buildings.reduce((a, b) => a + b.count, 0)}</div>
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

		<!-- Charts row -->
		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:24px;">
			{#await statsPromise}
				<div style="height:180px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
				<div style="height:180px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then civilizationStats}
				{@const resources = civilizationStats.map(({ resources }) => resources)}
				{@const peoples = civilizationStats.map(({ people }) => people)}
				{@const labels = civilizationStats.map(({ month, event }) => `M${month}${event ? ` (${eventsName[event as Events]})` : ''}`)}

				{#if resources.length}
					<button
						class="chart-panel civ-inner-card"
						onclick={() => openPanel('resources')}
						style="text-align:left; background:none; width:100%; font-family:inherit;"
						title="Cliquer pour agrandir"
					>
						<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
							<h2 class="civ-section-title" style="margin:0;">Progression des ressources</h2>
							<ZoomIn size="16" style="color:oklch(0.6 0.04 60); flex-shrink:0;" />
						</div>
						{#await import('$lib/components/charts/Bar.svelte') then { default: Line }}
							<Line
								data={{
									labels,
									datasets: buildResourceDatasets(civilizationStats)
								}}
							/>
						{/await}
					</button>
				{/if}

				{#if peoples.length}
					<button
						class="chart-panel civ-inner-card"
						onclick={() => openPanel('population')}
						style="text-align:left; background:none; width:100%; font-family:inherit;"
						title="Cliquer pour agrandir"
					>
						<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
							<h2 class="civ-section-title" style="margin:0;">Progression de la population</h2>
							<ZoomIn size="16" style="color:oklch(0.6 0.04 60); flex-shrink:0;" />
						</div>
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
					</button>
				{/if}
			{/await}
		</div>

		<!-- Jobs + Gender row -->
		<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:20px;">
			{#await jobsPromise}
				<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then jobs}
				{@const activeEntries = Object.entries(jobs).filter(([k]) => k !== 'child')}
				{@const activeTotal = activeEntries.reduce((a: number, [, b]) => a + (b as number), 0)}
				<button
					class="chart-panel civ-inner-card"
					onclick={() => openPanel('jobs')}
					style="text-align:left; background:none; width:100%; font-family:inherit;"
					title="Cliquer pour agrandir"
				>
					<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
						<h2 class="civ-section-title" style="margin:0;">Répartition des métiers</h2>
						<ZoomIn size="16" style="color:oklch(0.6 0.04 60); flex-shrink:0;" />
					</div>
					<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px 32px;">
						{#each activeEntries.sort(([,a],[,b]) => (b as number)-(a as number)) as [key, count], i}
							{@const total = activeTotal}
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
				</button>
			{/await}

			{#await peopleRatioPromise}
				<div style="height:200px; border-radius:4px; background:oklch(0.9 0.02 80); animation:civPulse 1.5s ease infinite;"></div>
			{:then peopleRatio}
				{#if peopleRatio}
					<button
						class="chart-panel civ-inner-card"
						onclick={() => openPanel('gender')}
						style="text-align:left; background:none; width:100%; font-family:inherit; display:flex; flex-direction:column; align-items:stretch;"
						title="Cliquer pour agrandir"
					>
						<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
							<h2 class="civ-section-title" style="margin:0; align-self:flex-start;">Rapport homme/femme</h2>
							<ZoomIn size="16" style="color:oklch(0.6 0.04 60); flex-shrink:0;" />
						</div>
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
					</button>
				{/if}
			{/await}
		</div>

		<!-- Resources -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<h2 class="civ-section-title">Ressources actuelles</h2>
			<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px 32px;">
				{#each data.civilization.resources as resource}
					{@const capacity = cacheCount * (STORAGE_PER_CACHE[resource.type] ?? 0)}
					{@const over = Math.max(0, resource.quantity - capacity)}
					{@const total = Math.max(resource.quantity, capacity, 1)}
					{@const storedW = (Math.min(resource.quantity, capacity) / total) * 100}
					{@const overW = (over / total) * 100}
					<div>
						<div style="display:flex; justify-content:space-between; align-items:baseline; font-size:16px; margin-bottom:4px;">
							<span>{resourceNames[resource.type]}</span>
							<span style="font-size:14px;">
								<span style="color:{over > 0 ? OVERFLOW_COLOR : 'oklch(0.4 0.04 40)'}; font-weight:600;">{resource.quantity.toLocaleString('fr-FR')}</span>
								<span style="color:oklch(0.55 0.03 50);"> / {capacity.toLocaleString('fr-FR')}</span>
							</span>
						</div>
						<div class="civ-progress-bar" style="display:flex; overflow:hidden;">
							<div style="width:{storedW}%; height:100%; background:{RESOURCE_COLORS[resource.type] ?? 'oklch(0.55 0.1 130)'}; transition:width .3s;"></div>
							{#if overW > 0}
								<div style="width:{overW}%; height:100%; background:{OVERFLOW_COLOR}; transition:width .3s;" title="Surplus au-delà de la capacité"></div>
							{/if}
						</div>
						{#if capacity === 0}
							<div style="font-size:13px; color:{OVERFLOW_COLOR}; margin-top:4px;">⚠ Aucune capacité de stockage (construisez un Entrepôt)</div>
						{:else if over > 0}
							<div style="font-size:13px; color:{OVERFLOW_COLOR}; margin-top:4px;">⚠ Surplus : +{over.toLocaleString('fr-FR')} au-delà de la capacité de stockage</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- People table -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<h2 class="civ-section-title">Citoyens ({data.civilization.citizensCount} au total)</h2>
			{#await peoplePromise}
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

		<!-- Constructions en cours -->
		<div class="civ-inner-card" style="margin-top:20px;">
			<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
				<Hammer size="18" style="color:oklch(0.5 0.1 50); flex-shrink:0;" />
				<h2 class="civ-section-title" style="margin:0;">Constructions en cours ({pendingConstructions.length} au total)</h2>
			</div>

			{#if pendingGroups.length === 0}
				<p style="color:oklch(0.55 0.03 50); font-size:15px; font-style:italic; margin-top:8px;">Aucune construction en cours pour le moment.</p>
			{:else}
				<div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
					{#each pendingGroups as group (group.buildingType)}
						<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:4px; background:oklch(0.97 0.01 84); border:1px solid oklch(0.83 0.04 70);">
							<div style="flex:1; min-width:0;">
								<div style="font-family:'Marcellus',serif; font-size:16px; color:oklch(0.35 0.04 40);">
									{buildingNames[group.buildingType] ?? group.buildingType}
									{#if group.count > 1}<span style="color:oklch(0.5 0.03 50); font-size:14px;"> ×{group.count}</span>{/if}
								</div>
								<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
									{#each group.breakdown as slot}
										<span style="font-size:13px; color:oklch(0.42 0.06 50); background:oklch(0.92 0.03 78); border:1px solid oklch(0.82 0.04 70); border-radius:999px; padding:2px 10px;">
											{#if group.breakdown.length > 1 || slot.count > 1}{slot.count} · {/if}{monthsLabel(slot.monthsRemaining)}
										</span>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Combat Log Summary -->
		<div class="civ-inner-card" style="margin-top:24px;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
				<h2 class="civ-section-title" style="margin:0;">Conflits récents</h2>
				<a href="/my-civilizations/{data.civilization.id}/combats" style="font-size:15px; color:oklch(0.5 0.13 34); font-family:'EB Garamond',serif; text-decoration:none;">Voir tous les combats →</a>
			</div>

			{#await combatLogsPromise}
				<p style="color:oklch(0.55 0.03 50); font-size:15px;">Chargement…</p>
			{:then logs}
				{#if !logs || logs.length === 0}
					<p style="color:oklch(0.55 0.03 50); font-size:15px; font-style:italic;">Aucun conflit enregistré.</p>
				{:else}
					<div style="display:flex; flex-direction:column; gap:10px;">
						{#each logs as log}
							{@const isAttacker = log.role === 'attacker'}
							{@const won = isAttacker ? log.attackerWins : !log.attackerWins}
							{@const totalPlunder = log.plunderedResources.reduce((s: number, r: { amount: number }) => s + r.amount, 0)}
							<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:4px; background:oklch(0.97 0.01 84); border:1px solid oklch(0.83 0.04 70);">
								<span style="font-size:20px; flex-shrink:0;">{isAttacker ? '⚔' : '🛡'}</span>
								<div style="flex:1; min-width:0;">
									<div style="font-family:'Marcellus',serif; font-size:15px; color:oklch(0.35 0.04 40);">
										{isAttacker ? 'Attaque contre' : 'Défense contre'} <strong>{log.opponentName}</strong>
									</div>
									<div style="font-size:13px; color:oklch(0.55 0.03 50);">Mois {log.month}</div>
								</div>
								<div style="text-align:right; flex-shrink:0;">
									<div style="font-family:'Marcellus',serif; font-size:14px; color:{won ? 'oklch(0.42 0.14 145)' : 'oklch(0.5 0.18 30)'}; font-weight:600;">
										{won ? 'Victoire' : 'Défaite'}
									</div>
									{#if isAttacker && log.attackerWins && totalPlunder > 0}
										<div style="font-size:12px; color:oklch(0.5 0.09 70);">+{totalPlunder} ressources</div>
									{/if}
									{#if isAttacker && log.attackerWins && log.captivesTaken > 0}
										<div style="font-size:12px; color:oklch(0.5 0.08 50);">{log.captivesTaken} captif{log.captivesTaken > 1 ? 's' : ''}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:catch}
				<p style="color:oklch(0.5 0.18 30); font-size:15px;">Impossible de charger les conflits.</p>
			{/await}
		</div>
	</div>
</div>

<style>
	.chart-panel {
		cursor: pointer;
		transition: box-shadow 0.15s ease, transform 0.15s ease;
		border: none;
		appearance: none;
		-webkit-appearance: none;
	}
	.chart-panel:hover {
		transform: translateY(-2px);
		box-shadow:
			inset 0 0 0 5px oklch(0.93 0.03 84),
			inset 0 0 0 6px oklch(0.68 0.07 60),
			0 16px 40px rgba(60,40,20,.18);
	}
	.chart-panel:focus-visible {
		outline: 2px solid oklch(0.5 0.13 34);
		outline-offset: 2px;
	}
</style>
